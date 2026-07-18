'use client'

import { useBuilderStore } from '@/store/builder-store'
import { useBacktest } from '@/hooks/useBacktest'
import type { Trade, BacktestMetrics } from '@/types/backtest'

function MetricCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-gray-800 p-3 rounded-lg">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${color || 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function TradeRow({ trade }: { trade: Trade }) {
  const isProfit = trade.pnl > 0
  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
      <td className="px-3 py-2 text-sm text-gray-300">
        {new Date(trade.entryTime * 1000).toLocaleDateString()}
      </td>
      <td className="px-3 py-2">
        <span className={`text-xs px-2 py-1 rounded ${
          trade.type === 'LONG' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
        }`}>
          {trade.type}
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-gray-300">${trade.entryPrice.toFixed(2)}</td>
      <td className="px-3 py-2 text-sm text-gray-300">${trade.exitPrice.toFixed(2)}</td>
      <td className={`px-3 py-2 text-sm font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
        {isProfit ? '+' : ''}{trade.pnl.toFixed(2)}
      </td>
      <td className={`px-3 py-2 text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
        {isProfit ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
      </td>
      <td className="px-3 py-2 text-xs text-gray-500">
        {trade.exitReason.replace('_', ' ')}
      </td>
    </tr>
  )
}

export function BacktestPanel() {
  const { backtestResult, backtestConfig, setBacktestConfig, isBacktesting, backtestError } = useBuilderStore()
  const { runBacktest } = useBacktest()

  const metrics = backtestResult?.metrics

  return (
    <div className="h-full flex flex-col">
      {/* Config bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700">
        <select
          value={backtestConfig.symbol}
          onChange={(e) => setBacktestConfig({ symbol: e.target.value })}
          className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
        >
          <option value="BTCUSD">BTC/USD</option>
          <option value="ETHUSD">ETH/USD</option>
          <option value="EURUSD">EUR/USD</option>
          <option value="SPY">SPY</option>
        </select>

        <select
          value={backtestConfig.timeframe}
          onChange={(e) => setBacktestConfig({ timeframe: e.target.value })}
          className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
        >
          <option value="1D">1D</option>
          <option value="4H">4H</option>
          <option value="1H">1H</option>
          <option value="15m">15m</option>
        </select>

        <input
          type="number"
          value={backtestConfig.initialCapital}
          onChange={(e) => setBacktestConfig({ initialCapital: Number(e.target.value) })}
          className="bg-gray-700 text-white text-sm rounded px-2 py-1 w-28 border border-gray-600"
          placeholder="Capital"
        />

        <button
          onClick={runBacktest}
          disabled={isBacktesting}
          className="ml-auto px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white text-sm rounded font-medium transition-colors"
        >
          {isBacktesting ? 'Running...' : 'Run Backtest'}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-4">
        {!backtestResult && !isBacktesting && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Generate a strategy and run a backtest to see results</p>
          </div>
        )}

        {isBacktesting && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-400">Running backtest...</p>
            </div>
          </div>
        )}

        {backtestError && !isBacktesting && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-400 font-medium mb-1">Backtest Failed</p>
              <p className="text-sm text-gray-500">{backtestError}</p>
            </div>
          </div>
        )}

        {backtestResult && metrics && (
          <div className="space-y-6">
            {/* Key metrics */}
            <div className="grid grid-cols-4 gap-3">
              <MetricCard
                label="Total P&L"
                value={`$${metrics.totalPnl.toFixed(2)}`}
                color={metrics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
              />
              <MetricCard
                label="Win Rate"
                value={`${metrics.winRate.toFixed(1)}%`}
                color={metrics.winRate >= 50 ? 'text-green-400' : 'text-yellow-400'}
              />
              <MetricCard
                label="Profit Factor"
                value={metrics.profitFactor.toFixed(2)}
                color={metrics.profitFactor >= 1.5 ? 'text-green-400' : 'text-yellow-400'}
              />
              <MetricCard
                label="Max Drawdown"
                value={`${metrics.maxDrawdownPercent.toFixed(1)}%`}
                color="text-red-400"
              />
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-5 gap-3">
              <MetricCard label="Total Trades" value={metrics.totalTrades} />
              <MetricCard label="Winning" value={metrics.winningTrades} color="text-green-400" />
              <MetricCard label="Losing" value={metrics.losingTrades} color="text-red-400" />
              <MetricCard label="Sharpe Ratio" value={metrics.sharpeRatio.toFixed(2)} />
              <MetricCard label="Avg Trade" value={`${metrics.averageTradeDuration}d`} />
            </div>

            {/* Trade list */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Trade History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-700">
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Entry</th>
                      <th className="px-3 py-2 text-left">Exit</th>
                      <th className="px-3 py-2 text-left">P&L</th>
                      <th className="px-3 py-2 text-left">%</th>
                      <th className="px-3 py-2 text-left">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestResult.trades.slice(0, 50).map((trade) => (
                      <TradeRow key={trade.id} trade={trade} />
                    ))}
                  </tbody>
                </table>
                {backtestResult.trades.length > 50 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Showing 50 of {backtestResult.trades.length} trades
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
