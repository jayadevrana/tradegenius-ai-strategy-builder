import { openai, AI_MODEL } from '@/lib/openai'
import { PINE_GENERATION_SYSTEM_PROMPT, buildGeneratePrompt } from '@/prompts/generate-pine'
import type { GenerateRequest, GenerateResponse, StrategyDefinition } from '@/types/strategy'

// Strip markdown code blocks from AI response
function stripMarkdownCodeBlocks(content: string): string {
  let cleaned = content.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  return cleaned.trim()
}

// Extract Pine Script from nested JSON if needed
function extractPineScript(content: string): string {
  return content.replace(/\\n/g, '\n').replace(/\\"/g, '"')
}

// Auto-fix common v6 issues in generated code
function autoFixV6Issues(pineScript: string): string {
  let fixed = pineScript

  // Fix alertcondition() in strategies -> convert to alert()
  if (/strategy\s*\(/.test(fixed)) {
    // Replace alertcondition() calls with alert() in strategies
    fixed = fixed.replace(
      /alertcondition\s*\(\s*([^,]+),\s*title\s*=\s*"([^"]+)",\s*message\s*=\s*"([^"]+)"\s*\)/g,
      'alert($1, title = "$2", message = "$3", alert.freq_once_per_bar_close)'
    )
    // Also handle simpler alertcondition patterns
    fixed = fixed.replace(
      /alertcondition\s*\(\s*([^,]+),\s*title\s*=\s*"([^"]+)"\s*\)/g,
      'alert($1, title = "$2", alert.freq_once_per_bar_close)'
    )
  }

  // Fix linewidth = 0 -> linewidth = 1
  fixed = fixed.replace(/linewidth\s*=\s*0\b/g, 'linewidth = 1')

  // Fix transp = X -> use color.new()
  // This is complex, so we just warn in validation

  return fixed
}

// Parse AI response with robust error handling
function parseAIResponse(content: string): GenerateResponse {
  const cleaned = stripMarkdownCodeBlocks(content)

  try {
    const parsed = JSON.parse(cleaned)
    return {
      pineScript: autoFixV6Issues(extractPineScript(parsed.pineScript)),
      strategyJson: parsed.strategyJson as StrategyDefinition,
      explanation: parsed.explanation || '',
    }
  } catch {
    // Try to extract pineScript from malformed JSON
    const pineMatch = cleaned.match(/"pineScript"\s*:\s*"([\s\S]*?)"\s*,\s*"strategyJson"/)
    const explanationMatch = cleaned.match(/"explanation"\s*:\s*"([^"]+)"/)
    const strategyJsonMatch = cleaned.match(/"strategyJson"\s*:\s*(\{[\s\S]*?\})\s*,\s*"explanation"/)

    let pineScript = ''
    if (pineMatch) {
      pineScript = extractPineScript(pineMatch[1])
    } else {
      // Last resort: try to find //@version=6 block
      const versionMatch = cleaned.match(/(\/\/@version=6[\s\S]*$)/)
      pineScript = versionMatch ? versionMatch[1] : cleaned
    }

    let strategyJson: StrategyDefinition | null = null
    if (strategyJsonMatch) {
      try {
        strategyJson = JSON.parse(strategyJsonMatch[1])
      } catch {
        // Ignore parse error
      }
    }

    return {
      pineScript: autoFixV6Issues(pineScript),
      strategyJson: strategyJson || {
        name: 'Generated Strategy',
        description: '',
        timeframe: '1D',
        indicators: [],
        entryConditions: [],
        exitConditions: [],
        positionSizing: { type: 'percentage', value: 10 },
        riskManagement: { stopLoss: 2, takeProfit: 4 },
      },
      explanation: explanationMatch ? explanationMatch[1] : '',
    }
  }
}

export async function generateStrategy(
  request: GenerateRequest
): Promise<GenerateResponse> {
  const { prompt, language = 'pine', timeframe } = request

  const userMessage = buildGeneratePrompt(prompt, language, timeframe)

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: PINE_GENERATION_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 8192,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from AI')
  }

  return parseAIResponse(content)
}

export async function generateStrategyStream(
  request: GenerateRequest
): Promise<ReadableStream<Uint8Array>> {
  const { prompt, language = 'pine', timeframe } = request

  const userMessage = buildGeneratePrompt(prompt, language, timeframe)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: PINE_GENERATION_SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 8192,
          stream: true,
        })

        let fullContent = ''

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            fullContent += delta
            const data = JSON.stringify({ type: 'chunk', content: delta })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        }

        // Parse the complete response
        try {
          const result = parseAIResponse(fullContent)
          const data = JSON.stringify({ type: 'complete', result })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch (error) {
          const data = JSON.stringify({ type: 'error', error: `Failed to parse AI response: ${error}` })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        controller.close()
      } catch (error) {
        const data = JSON.stringify({ type: 'error', error: String(error) })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        controller.close()
      }
    },
  })

  return stream
}
