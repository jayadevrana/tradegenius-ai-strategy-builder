'use client'

import { useState } from 'react'
import { PromptInput } from '@/components/builder/PromptInput'
import { CodeEditor } from '@/components/builder/CodeEditor'
import { BacktestPanel } from '@/components/builder/BacktestPanel'
import { ChartViewer } from '@/components/builder/ChartViewer'
import { useBuilderStore } from '@/store/builder-store'
import Link from 'next/link'

type Tab = 'code' | 'backtest' | 'chart'

export default function BuilderPage() {
  const { activeTab, setActiveTab, explanation, pineScript, backtestResult } = useBuilderStore()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (pineScript) {
      navigator.clipboard.writeText(pineScript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="font-bold">Tradegenius</span>
          </Link>
          <span className="text-gray-600">|</span>
          <span className="text-sm text-gray-400">Strategy Builder</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            disabled={!pineScript}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Pine Script'}
          </button>
          <Link
            href="/strategies"
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            My Strategies
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel - Input */}
        <div className="w-1/3 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-400 mb-3">Describe Your Strategy</h2>
            <PromptInput />
          </div>

          {/* Explanation */}
          {explanation && (
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-xs font-medium text-gray-500 mb-2">AI EXPLANATION</h3>
              <p className="text-sm text-gray-300">{explanation}</p>
            </div>
          )}

          {/* Quick stats */}
          <div className="flex-1 p-4 overflow-auto">
            <h3 className="text-xs font-medium text-gray-500 mb-3">QUICK STATS</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Code Lines</p>
                <p className="text-lg font-semibold">
                  {pineScript ? pineScript.split('\n').length : '-'}
                </p>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Win Rate</p>
                <p className="text-lg font-semibold text-green-400">
                  {backtestResult ? `${backtestResult.metrics.winRate.toFixed(1)}%` : '-'}
                </p>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total P&L</p>
                <p className={`text-lg font-semibold ${backtestResult && backtestResult.metrics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {backtestResult ? `$${backtestResult.metrics.totalPnl.toFixed(2)}` : '-'}
                </p>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Trades</p>
                <p className="text-lg font-semibold">
                  {backtestResult ? backtestResult.metrics.totalTrades : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Code / Backtest / Chart */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 bg-gray-900 border-b border-gray-800">
            {(['code', 'backtest', 'chart'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm rounded transition-colors ${
                  activeTab === tab
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0">
            {activeTab === 'code' && <CodeEditor />}
            {activeTab === 'backtest' && <BacktestPanel />}
            {activeTab === 'chart' && <ChartViewer />}
          </div>
        </div>
      </div>
    </div>
  )
}
