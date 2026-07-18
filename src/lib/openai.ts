import OpenAI from 'openai'

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined
}

// OpenClaude proxy configuration - FREE, no API key needed
// Uses your existing OpenClaude session through Gitlawb Opengateway
const OPENCLAUDE_BASE_URL = 'https://opengateway.gitlawb.com/v1/xiaomi-mimo'
const OPENCLAUDE_MODEL = 'mimo-v2.5-pro'

function createOpenAIClient(): OpenAI {
  const baseURL = process.env.OPENAI_BASE_URL || OPENCLAUDE_BASE_URL
  const apiKey = process.env.OPENAI_API_KEY || 'not-needed'

  return new OpenAI({
    apiKey,
    baseURL,
  })
}

export const openai = globalForOpenAI.openai ?? createOpenAIClient()

if (process.env.NODE_ENV !== 'production') globalForOpenAI.openai = openai

// Export model name for use in generate-engine
export const AI_MODEL = process.env.OPENAI_MODEL || OPENCLAUDE_MODEL
export const AI_BASE_URL = process.env.OPENAI_BASE_URL || OPENCLAUDE_BASE_URL
