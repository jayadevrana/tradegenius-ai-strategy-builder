import { describe, it, expect } from 'vitest'
import { runBacktest, generateSyntheticCandles } from '@/engines/backtest-engine'
import type { StrategyDefinition } from '@/types/strategy'
import type { BacktestConfig } from '@/types/backtest'

const defaultStrategy: StrategyDefinition = {
  name: 'Test RSI Strategy',
  description: 'Buy when RSI < 30, sell when RSI > 70',
  timeframe: '1D',
  indicators: [
    { name: 'RSI', type: 'rsi', params: { period: 14 } },
  ],
  entryConditions: [
    { indicator: 'RSI', operator: 'lt', value: 30 },
  ],
  exitConditions: [
    { indicator: 'RSI', operator: 'gt', value: 70 },
  ],
  positionSizing: { type: 'percentage', value: 10 },
  riskManagement: { stopLoss: 2, takeProfit: 4 },
}

const defaultConfig: BacktestConfig = {
  symbol: 'BTCUSD',
  timeframe: '1D',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  initialCapital: 10000,
  commission: 0.1,
  slippage: 0.05,
}

describe('Backtest Engine', () => {
  describe('generateSyntheticCandles', () => {
    it('should generate correct number of candles', () => {
      const candles = generateSyntheticCandles(30)
      expect(candles.length).toBe(31) // 30 days + today
    })

    it('should have valid OHLCV data', () => {
      const candles = generateSyntheticCandles(10)
      candles.forEach(candle => {
        expect(candle.open).toBeGreaterThan(0)
        expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open, candle.close))
        expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close))
        expect(candle.close).toBeGreaterThan(0)
        expect(candle.volume).toBeGreaterThan(0)
        expect(candle.time).toBeGreaterThan(0)
      })
    })

    it('should use base price as starting point', () => {
      const candles = generateSyntheticCandles(10, 200)
      expect(candles[0].open).toBe(200)
    })
  })

  describe('runBacktest', () => {
    it('should return valid backtest result structure', () => {
      const candles = generateSyntheticCandles(365)
      const result = runBacktest(candles, defaultStrategy, defaultConfig)

      expect(result).toHaveProperty('trades')
      expect(result).toHaveProperty('equityCurve')
      expect(result).toHaveProperty('metrics')
      expect(result).toHaveProperty('monthlyReturns')
      expect(Array.isArray(result.trades)).toBe(true)
      expect(Array.isArray(result.equityCurve)).toBe(true)
    })

    it('should have valid metrics', () => {
      const candles = generateSyntheticCandles(365)
      const result = runBacktest(candles, defaultStrategy, defaultConfig)
      const { metrics } = result

      expect(metrics.totalTrades).toBeGreaterThanOrEqual(0)
      expect(metrics.winRate).toBeGreaterThanOrEqual(0)
      expect(metrics.winRate).toBeLessThanOrEqual(100)
      expect(metrics.profitFactor).toBeGreaterThanOrEqual(0)
      expect(metrics.maxDrawdownPercent).toBeGreaterThanOrEqual(0)
      expect(metrics.maxDrawdownPercent).toBeLessThanOrEqual(100)
    })

    it('should have equity curve matching candle count', () => {
      const candles = generateSyntheticCandles(100)
      const result = runBacktest(candles, defaultStrategy, defaultConfig)

      // Equity curve starts from index 1 (skips first candle)
      expect(result.equityCurve.length).toBe(candles.length - 1)
    })

    it('should have trades with valid P&L', () => {
      const candles = generateSyntheticCandles(365)
      const result = runBacktest(candles, defaultStrategy, defaultConfig)

      result.trades.forEach(trade => {
        expect(trade.entryPrice).toBeGreaterThan(0)
        expect(trade.exitPrice).toBeGreaterThan(0)
        expect(trade.quantity).toBeGreaterThan(0)
        expect(typeof trade.pnl).toBe('number')
        expect(typeof trade.pnlPercent).toBe('number')
        expect(['LONG', 'SHORT']).toContain(trade.type)
        expect(['signal', 'stop_loss', 'take_profit', 'trailing_stop', 'end_of_data']).toContain(trade.exitReason)
      })
    })

    it('should handle empty strategy (no conditions)', () => {
      const emptyStrategy: StrategyDefinition = {
        name: 'Empty',
        description: 'No conditions',
        timeframe: '1D',
        indicators: [],
        entryConditions: [],
        exitConditions: [],
        positionSizing: { type: 'percentage', value: 10 },
        riskManagement: {},
      }

      const candles = generateSyntheticCandles(100)
      const result = runBacktest(candles, emptyStrategy, defaultConfig)

      expect(result.trades.length).toBe(0)
      expect(result.metrics.totalTrades).toBe(0)
    })
  })
})
