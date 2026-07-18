'use client'

import { useCallback } from 'react'
import { useBuilderStore } from '@/store/builder-store'
import type { BacktestResult } from '@/types/backtest'

export function useBacktest() {
  const {
    pineScript,
    strategyJson,
    backtestConfig,
    setBacktestResult,
    setIsBacktesting,
    setBacktestError,
    isBacktesting,
  } = useBuilderStore()

  const runBacktest = useCallback(async () => {
    if (!pineScript) return

    setIsBacktesting(true)
    setBacktestResult(null)
    setBacktestError(null)

    try {
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pineScript,
          strategyJson,
          config: backtestConfig,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Backtest failed')
      }

      const result: BacktestResult = await response.json()
      setBacktestResult(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Backtest failed'
      console.error('Backtest error:', message)
      setBacktestError(message)
    } finally {
      setIsBacktesting(false)
    }
  }, [pineScript, strategyJson, backtestConfig, setBacktestResult, setIsBacktesting, setBacktestError])

  return { runBacktest, isBacktesting }
}
