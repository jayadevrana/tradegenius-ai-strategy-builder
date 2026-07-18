'use client'

import { useState } from 'react'
import { useBuilderStore } from '@/store/builder-store'
import { useStreaming } from '@/hooks/useStreaming'

const EXAMPLE_PROMPTS = [
  'Buy when RSI drops below 30 and MACD crosses bullish on the daily chart. Sell when RSI goes above 70.',
  'Create a moving average crossover strategy with 20 EMA and 50 EMA. Buy when fast crosses above slow, sell when it crosses below.',
  'Build a Bollinger Band squeeze strategy. Buy when bands contract and price breaks above upper band. Sell on middle band touch.',
  'Design a momentum strategy using RSI and volume. Buy on high volume RSI breakout above 50. Sell on RSI drop below 40.',
]

export function PromptInput() {
  const { prompt, setPrompt, isGenerating } = useBuilderStore()
  const { generate, cancel } = useStreaming()
  const [showExamples, setShowExamples] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return
    await generate(prompt)
  }

  const handleExampleClick = (example: string) => {
    setPrompt(example)
    setShowExamples(false)
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your trading strategy in plain English..."
            className="w-full min-h-[120px] p-4 pr-32 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            disabled={isGenerating}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Examples
            </button>
            {isGenerating ? (
              <button
                type="button"
                onClick={cancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Generate
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Example prompts dropdown */}
      {showExamples && (
        <div className="mt-2 p-3 bg-gray-800 border border-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">Example strategies:</p>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                className="w-full text-left p-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isGenerating && (
        <div className="mt-3 flex items-center gap-2 text-blue-400">
          <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
          <span className="text-sm">Generating Pine Script...</span>
        </div>
      )}
    </div>
  )
}
