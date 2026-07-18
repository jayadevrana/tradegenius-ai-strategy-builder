import type {
  BacktestConfig,
  BacktestResult,
  BacktestMetrics,
  Candle,
  Trade,
  EquityPoint,
} from '@/types/backtest'
import type { StrategyDefinition, Condition } from '@/types/strategy'
import { v4 as uuidv4 } from 'uuid'

// Generate synthetic OHLCV data for demo/testing
export function generateSyntheticCandles(
  days: number = 365,
  basePrice: number = 100
): Candle[] {
  const candles: Candle[] = []
  let price = basePrice
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  for (let i = days; i >= 0; i--) {
    const time = now - i * dayMs
    const change = (Math.random() - 0.48) * 4 // slight upward bias
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * 2
    const low = Math.min(open, close) - Math.random() * 2
    const volume = Math.floor(Math.random() * 1000000) + 100000

    candles.push({
      time: Math.floor(time / 1000),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    })

    price = close
  }

  return candles
}

// Simple RSI calculation
function calculateRSI(candles: Candle[], period: number = 14): number[] {
  const rsi: number[] = []
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }

  for (let i = period; i < gains.length; i++) {
    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period

    if (avgLoss === 0) {
      rsi.push(100)
    } else {
      const rs = avgGain / avgLoss
      rsi.push(100 - 100 / (1 + rs))
    }
  }

  // Pad beginning with NaN
  return Array(period).fill(NaN).concat(rsi)
}

// Simple SMA calculation
function calculateSMA(candles: Candle[], period: number): number[] {
  const sma: number[] = []

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      sma.push(NaN)
    } else {
      const sum = candles.slice(i - period + 1, i + 1).reduce((a, c) => a + c.close, 0)
      sma.push(sum / period)
    }
  }

  return sma
}

// Evaluate a single condition against indicator values
function evaluateCondition(
  condition: Condition,
  indicators: Record<string, number[]>,
  index: number
): boolean {
  const indicatorValues = indicators[condition.indicator]
  if (!indicatorValues) return false

  const currentValue = indicatorValues[index]
  if (isNaN(currentValue)) return false

  const compareValue = typeof condition.value === 'number'
    ? condition.value
    : indicators[condition.value]?.[index] ?? NaN

  if (isNaN(compareValue)) return false

  switch (condition.operator) {
    case 'gt': return currentValue > compareValue
    case 'lt': return currentValue < compareValue
    case 'eq': return Math.abs(currentValue - compareValue) < 0.001
    case 'gte': return currentValue >= compareValue
    case 'lte': return currentValue <= compareValue
    case 'crosses_above': {
      const prev = indicatorValues[index - 1]
      const prevCompare = typeof condition.value === 'number'
        ? condition.value
        : indicators[condition.value]?.[index - 1] ?? NaN
      return !isNaN(prev) && !isNaN(prevCompare) && prev <= prevCompare && currentValue > compareValue
    }
    case 'crosses_below': {
      const prev = indicatorValues[index - 1]
      const prevCompare = typeof condition.value === 'number'
        ? condition.value
        : indicators[condition.value]?.[index - 1] ?? NaN
      return !isNaN(prev) && !isNaN(prevCompare) && prev >= prevCompare && currentValue < compareValue
    }
    default: return false
  }
}

// Evaluate a set of conditions (combined with AND/OR)
function evaluateConditions(
  conditions: Condition[],
  indicators: Record<string, number[]>,
  index: number
): boolean {
  if (conditions.length === 0) return false

  let result = evaluateCondition(conditions[0], indicators, index)

  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i]
    const conditionResult = evaluateCondition(condition, indicators, index)

    if (condition.combineWith === 'OR') {
      result = result || conditionResult
    } else {
      result = result && conditionResult
    }
  }

  return result
}

// Calculate all indicators from strategy definition
function calculateIndicators(
  candles: Candle[],
  strategy: StrategyDefinition
): Record<string, number[]> {
  const indicators: Record<string, number[]> = {}

  for (const ind of strategy.indicators) {
    switch (ind.type.toLowerCase()) {
      case 'rsi':
        indicators[ind.name] = calculateRSI(candles, (ind.params.period as number) || 14)
        break
      case 'sma':
      case 'sma_close':
        indicators[ind.name] = calculateSMA(candles, (ind.params.period as number) || 20)
        break
      case 'ema':
        // Simplified EMA using SMA approximation
        indicators[ind.name] = calculateSMA(candles, (ind.params.period as number) || 20)
        break
      default:
        // Default to SMA for unknown indicators
        indicators[ind.name] = calculateSMA(candles, (ind.params.period as number) || 20)
    }
  }

  return indicators
}

// Main backtest engine
export function runBacktest(
  candles: Candle[],
  strategy: StrategyDefinition,
  config: BacktestConfig
): BacktestResult {
  const indicators = calculateIndicators(candles, strategy)
  const trades: Trade[] = []
  const equityCurve: EquityPoint[] = []

  let capital = config.initialCapital
  let position: { type: 'LONG' | 'SHORT'; entryPrice: number; entryTime: number; quantity: number } | null = null
  let peakEquity = capital
  let maxDrawdown = 0

  for (let i = 1; i < candles.length; i++) {
    const candle = candles[i]

    // Check exit conditions if in position
    if (position) {
      let shouldExit = false
      let exitReason: Trade['exitReason'] = 'signal'

      // Check stop loss
      if (strategy.riskManagement?.stopLoss) {
        const stopPrice = position.type === 'LONG'
          ? position.entryPrice * (1 - strategy.riskManagement.stopLoss / 100)
          : position.entryPrice * (1 + strategy.riskManagement.stopLoss / 100)

        if (position.type === 'LONG' && candle.low <= stopPrice) {
          shouldExit = true
          exitReason = 'stop_loss'
        } else if (position.type === 'SHORT' && candle.high >= stopPrice) {
          shouldExit = true
          exitReason = 'stop_loss'
        }
      }

      // Check take profit
      if (!shouldExit && strategy.riskManagement?.takeProfit) {
        const tpPrice = position.type === 'LONG'
          ? position.entryPrice * (1 + strategy.riskManagement.takeProfit / 100)
          : position.entryPrice * (1 - strategy.riskManagement.takeProfit / 100)

        if (position.type === 'LONG' && candle.high >= tpPrice) {
          shouldExit = true
          exitReason = 'take_profit'
        } else if (position.type === 'SHORT' && candle.low <= tpPrice) {
          shouldExit = true
          exitReason = 'take_profit'
        }
      }

      // Check exit signal
      if (!shouldExit && evaluateConditions(strategy.exitConditions, indicators, i)) {
        shouldExit = true
        exitReason = 'signal'
      }

      if (shouldExit) {
        const exitPrice = exitReason === 'stop_loss'
          ? (position.type === 'LONG'
            ? position.entryPrice * (1 - (strategy.riskManagement?.stopLoss ?? 2) / 100)
            : position.entryPrice * (1 + (strategy.riskManagement?.stopLoss ?? 2) / 100))
          : candle.close

        const pnl = position.type === 'LONG'
          ? (exitPrice - position.entryPrice) * position.quantity
          : (position.entryPrice - exitPrice) * position.quantity

        const pnlPercent = (pnl / (position.entryPrice * position.quantity)) * 100

        trades.push({
          id: uuidv4(),
          type: position.type,
          entryTime: position.entryTime,
          entryPrice: position.entryPrice,
          exitTime: candle.time,
          exitPrice: Number(exitPrice.toFixed(2)),
          quantity: position.quantity,
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: Number(pnlPercent.toFixed(2)),
          exitReason,
        })

        capital += pnl
        position = null
      }
    }

    // Check entry conditions if no position
    if (!position && evaluateConditions(strategy.entryConditions, indicators, i)) {
      const positionSize = strategy.positionSizing.type === 'percentage'
        ? (capital * strategy.positionSizing.value / 100) / candle.close
        : strategy.positionSizing.value

      position = {
        type: 'LONG',
        entryPrice: candle.close,
        entryTime: candle.time,
        quantity: Number(positionSize.toFixed(4)),
      }
    }

    // Track equity and drawdown
    const currentEquity = position
      ? capital + (candle.close - position.entryPrice) * position.quantity
      : capital

    peakEquity = Math.max(peakEquity, currentEquity)
    const drawdown = peakEquity - currentEquity
    const drawdownPercent = (drawdown / peakEquity) * 100
    maxDrawdown = Math.max(maxDrawdown, drawdownPercent)

    equityCurve.push({
      time: candle.time,
      equity: Number(currentEquity.toFixed(2)),
      drawdown: Number(drawdownPercent.toFixed(2)),
    })
  }

  // Close any remaining position at last candle
  if (position) {
    const lastCandle = candles[candles.length - 1]
    const pnl = (lastCandle.close - position.entryPrice) * position.quantity

    trades.push({
      id: uuidv4(),
      type: position.type,
      entryTime: position.entryTime,
      entryPrice: position.entryPrice,
      exitTime: lastCandle.time,
      exitPrice: lastCandle.close,
      quantity: position.quantity,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(((pnl / (position.entryPrice * position.quantity)) * 100).toFixed(2)),
      exitReason: 'end_of_data',
    })

    capital += pnl
  }

  // Calculate metrics
  const metrics = calculateMetrics(trades, config.initialCapital, maxDrawdown)

  // Calculate monthly returns
  const monthlyReturns: Record<string, number> = {}
  for (const trade of trades) {
    const date = new Date(trade.exitTime * 1000)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyReturns[monthKey] = (monthlyReturns[monthKey] || 0) + trade.pnl
  }

  return { trades, equityCurve, metrics, monthlyReturns }
}

function calculateMetrics(
  trades: Trade[],
  initialCapital: number,
  maxDrawdownPercent: number
): BacktestMetrics {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnl: 0,
      totalPnlPercent: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      averageTradeDuration: 0,
    }
  }

  const winningTrades = trades.filter(t => t.pnl > 0)
  const losingTrades = trades.filter(t => t.pnl < 0)

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))

  // Calculate consecutive wins/losses
  let maxConsecutiveWins = 0
  let maxConsecutiveLosses = 0
  let currentWins = 0
  let currentLosses = 0

  for (const trade of trades) {
    if (trade.pnl > 0) {
      currentWins++
      currentLosses = 0
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins)
    } else {
      currentLosses++
      currentWins = 0
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses)
    }
  }

  // Calculate Sharpe ratio (simplified)
  const returns = trades.map(t => t.pnlPercent)
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Number(((winningTrades.length / trades.length) * 100).toFixed(2)),
    totalPnl: Number(totalPnl.toFixed(2)),
    totalPnlPercent: Number(((totalPnl / initialCapital) * 100).toFixed(2)),
    maxDrawdown: Number((maxDrawdownPercent * initialCapital / 100).toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    profitFactor: grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 999999 : 0,
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    averageWin: winningTrades.length > 0 ? Number((grossProfit / winningTrades.length).toFixed(2)) : 0,
    averageLoss: losingTrades.length > 0 ? Number((grossLoss / losingTrades.length).toFixed(2)) : 0,
    largestWin: winningTrades.length > 0 ? Number(Math.max(...winningTrades.map(t => t.pnl)).toFixed(2)) : 0,
    largestLoss: losingTrades.length > 0 ? Number(Math.min(...losingTrades.map(t => t.pnl)).toFixed(2)) : 0,
    consecutiveWins: maxConsecutiveWins,
    consecutiveLosses: maxConsecutiveLosses,
    averageTradeDuration: Number((trades.reduce((sum, t) => sum + (t.exitTime - t.entryTime), 0) / trades.length / 86400).toFixed(1)),
  }
}
