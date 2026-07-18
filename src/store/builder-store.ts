'use client'

import { create } from 'zustand'
import type { StrategyDefinition } from '@/types/strategy'
import type { BacktestResult, BacktestConfig } from '@/types/backtest'

interface BuilderState {
  // Prompt
  prompt: string
  setPrompt: (prompt: string) => void

  // Generated code
  pineScript: string
  setPineScript: (code: string) => void

  // Strategy definition
  strategyJson: StrategyDefinition | null
  setStrategyJson: (json: StrategyDefinition | null) => void

  // Explanation
  explanation: string
  setExplanation: (explanation: string) => void

  // Generation state
  isGenerating: boolean
  setIsGenerating: (isGenerating: boolean) => void

  // Backtest
  backtestConfig: BacktestConfig
  setBacktestConfig: (config: Partial<BacktestConfig>) => void
  backtestResult: BacktestResult | null
  setBacktestResult: (result: BacktestResult | null) => void
  isBacktesting: boolean
  setIsBacktesting: (isBacktesting: boolean) => void
  backtestError: string | null
  setBacktestError: (error: string | null) => void

  // Strategy management
  strategyId: string | null
  setStrategyId: (id: string | null) => void
  strategyName: string
  setStrategyName: (name: string) => void

  // UI state
  activeTab: 'code' | 'backtest' | 'chart'
  setActiveTab: (tab: 'code' | 'backtest' | 'chart') => void
  showSidebar: boolean
  toggleSidebar: () => void

  // Reset
  reset: () => void
}

const defaultBacktestConfig: BacktestConfig = {
  symbol: 'BTCUSD',
  timeframe: '1D',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  initialCapital: 10000,
  commission: 0.1,
  slippage: 0.05,
}

export const useBuilderStore = create<BuilderState>((set) => ({
  // Prompt
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),

  // Generated code
  pineScript: '',
  setPineScript: (pineScript) => set({ pineScript }),

  // Strategy definition
  strategyJson: null,
  setStrategyJson: (strategyJson) => set({ strategyJson }),

  // Explanation
  explanation: '',
  setExplanation: (explanation) => set({ explanation }),

  // Generation state
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  // Backtest
  backtestConfig: defaultBacktestConfig,
  setBacktestConfig: (config) =>
    set((state) => ({
      backtestConfig: { ...state.backtestConfig, ...config },
    })),
  backtestResult: null,
  setBacktestResult: (backtestResult) => set({ backtestResult }),
  isBacktesting: false,
  setIsBacktesting: (isBacktesting) => set({ isBacktesting }),
  backtestError: null,
  setBacktestError: (backtestError) => set({ backtestError }),

  // Strategy management
  strategyId: null,
  setStrategyId: (strategyId) => set({ strategyId }),
  strategyName: '',
  setStrategyName: (strategyName) => set({ strategyName }),

  // UI state
  activeTab: 'code',
  setActiveTab: (activeTab) => set({ activeTab }),
  showSidebar: true,
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),

  // Reset
  reset: () =>
    set({
      prompt: '',
      pineScript: '',
      strategyJson: null,
      explanation: '',
      isGenerating: false,
      backtestResult: null,
      isBacktesting: false,
      strategyId: null,
      strategyName: '',
      activeTab: 'code',
    }),
}))
