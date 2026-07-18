import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runBacktest, generateSyntheticCandles } from '@/engines/backtest-engine'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { StrategyDefinition } from '@/types/strategy'

const backtestSchema = z.object({
  pineScript: z.string().optional(),
  strategyJson: z.any().optional(),
  config: z.object({
    symbol: z.string().default('BTCUSD'),
    timeframe: z.string().default('1D'),
    startDate: z.string().default('2024-01-01'),
    endDate: z.string().default('2024-12-31'),
    initialCapital: z.number().min(100, 'Minimum capital is $100').max(10000000, 'Maximum capital is $10M').default(10000),
    commission: z.number().min(0).max(5).default(0.1),
    slippage: z.number().min(0).max(5).default(0.05),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const result = backtestSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { strategyJson, config } = result.data

    // Validate date range
    const startDate = new Date(config.startDate)
    const endDate = new Date(config.endDate)
    if (startDate >= endDate) {
      return Response.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      )
    }

    // Cap date range at 5 years to prevent resource exhaustion
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    if (days > 1825) {
      return Response.json(
        { error: 'Maximum date range is 5 years' },
        { status: 400 }
      )
    }

    // Use provided strategy JSON or create a default one
    const strategy: StrategyDefinition = strategyJson || {
      name: 'Default RSI Strategy',
      description: 'Buy when RSI < 30, sell when RSI > 70',
      timeframe: config.timeframe,
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

    // Generate synthetic candles for demo
    const candles = generateSyntheticCandles(days)

    // Run backtest
    const backtestResult = runBacktest(candles, strategy, config)

    // Save backtest if user is authenticated
    if (session?.user?.id) {
      await prisma.backtest.create({
        data: {
          strategyId: 'demo',
          userId: session.user.id,
          config,
          result: backtestResult as any,
          metrics: backtestResult.metrics as any,
        },
      }).catch(console.error)
    }

    return Response.json(backtestResult)
  } catch (error) {
    console.error('Backtest error:', error)
    return Response.json(
      { error: 'Failed to run backtest' },
      { status: 500 }
    )
  }
}
