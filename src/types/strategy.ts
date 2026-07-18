export interface StrategyDefinition {
  name: string
  description: string
  timeframe: string
  indicators: Indicator[]
  entryConditions: Condition[]
  exitConditions: Condition[]
  positionSizing: PositionSizing
  riskManagement: RiskManagement
}

export interface Indicator {
  name: string
  type: string
  params: Record<string, number | string>
}

export interface Condition {
  indicator: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'crosses_above' | 'crosses_below'
  value: number | string
  combineWith?: 'AND' | 'OR'
}

export interface PositionSizing {
  type: 'fixed' | 'percentage' | 'risk_based'
  value: number
}

export interface RiskManagement {
  stopLoss?: number
  takeProfit?: number
  trailingStop?: number
  maxPositions?: number
}

export interface GenerateRequest {
  prompt: string
  language?: 'pine' | 'mql5'
  timeframe?: string
}

export interface GenerateResponse {
  pineScript: string
  strategyJson: StrategyDefinition
  explanation: string
}
