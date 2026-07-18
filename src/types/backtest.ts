export interface BacktestConfig {
  symbol: string
  timeframe: string
  startDate: string
  endDate: string
  initialCapital: number
  commission: number
  slippage: number
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Trade {
  id: string
  type: 'LONG' | 'SHORT'
  entryTime: number
  entryPrice: number
  exitTime: number
  exitPrice: number
  quantity: number
  pnl: number
  pnlPercent: number
  exitReason: 'signal' | 'stop_loss' | 'take_profit' | 'trailing_stop' | 'end_of_data'
}

export interface BacktestMetrics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnl: number
  totalPnlPercent: number
  maxDrawdown: number
  maxDrawdownPercent: number
  profitFactor: number
  sharpeRatio: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  consecutiveWins: number
  consecutiveLosses: number
  averageTradeDuration: number
}

export interface EquityPoint {
  time: number
  equity: number
  drawdown: number
}

export interface BacktestResult {
  trades: Trade[]
  equityCurve: EquityPoint[]
  metrics: BacktestMetrics
  monthlyReturns: Record<string, number>
}

export interface BacktestRequest {
  strategyId?: string
  pineScript?: string
  config: BacktestConfig
}
