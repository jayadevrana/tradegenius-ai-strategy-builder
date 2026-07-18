'use client'

import { useCallback, useRef } from 'react'
import { useBuilderStore } from '@/store/builder-store'
import type { GenerateResponse } from '@/types/strategy'

export function useStreaming() {
  const abortControllerRef = useRef<AbortController | null>(null)
  const {
    setPineScript,
    setStrategyJson,
    setExplanation,
    setIsGenerating,
  } = useBuilderStore()

  const generate = useCallback(async (prompt: string) => {
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsGenerating(true)
    setPineScript('')
    setStrategyJson(null)
    setExplanation('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              switch (data.type) {
                case 'chunk':
                  setPineScript(data.content)
                  break
                case 'complete':
                  const result = data.result as GenerateResponse
                  setPineScript(result.pineScript)
                  setStrategyJson(result.strategyJson)
                  setExplanation(result.explanation)
                  break
                case 'error':
                  throw new Error(data.error)
              }
            } catch (e) {
              // Skip malformed JSON
              if (e instanceof SyntaxError) continue
              throw e
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled
      }
      throw error
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [setPineScript, setStrategyJson, setExplanation, setIsGenerating])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsGenerating(false)
    }
  }, [setIsGenerating])

  return { generate, cancel }
}
