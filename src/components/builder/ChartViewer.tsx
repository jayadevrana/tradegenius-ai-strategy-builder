'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts'
import type { IChartApi, CandlestickData, LineData } from 'lightweight-charts'
import { useBuilderStore } from '@/store/builder-store'
import { generateSyntheticCandles } from '@/engines/backtest-engine'

export function ChartViewer() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<any>(null)
  const equitySeriesRef = useRef<any>(null)

  const { backtestResult } = useBuilderStore()

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a2e' },
        textColor: '#d4d4d4',
      },
      grid: {
        vertLines: { color: '#2a2a3e' },
        horzLines: { color: '#2a2a3e' },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: '#3a3a4e',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#3a3a4e',
      },
    })

    chartRef.current = chart

    // Add candlestick series (v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    })

    candleSeriesRef.current = candleSeries

    // Load demo data
    const candles = generateSyntheticCandles(180)
    const candleData: CandlestickData[] = candles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    candleSeries.setData(candleData)

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // Update chart with backtest results
  useEffect(() => {
    if (!backtestResult || !chartRef.current) return

    // Add equity curve as line series (v5 API)
    if (equitySeriesRef.current) {
      chartRef.current.removeSeries(equitySeriesRef.current)
    }

    const equitySeries = chartRef.current.addSeries(LineSeries, {
      color: '#2196F3',
      lineWidth: 2,
      priceScaleId: 'equity',
    })

    equitySeriesRef.current = equitySeries

    const equityData: LineData[] = backtestResult.equityCurve.map((p) => ({
      time: p.time as any,
      value: p.equity,
    }))

    equitySeries.setData(equityData)

    // Add trade markers
    if (candleSeriesRef.current && backtestResult.trades.length > 0) {
      const markers = backtestResult.trades.flatMap((trade) => [
        {
          time: trade.entryTime as any,
          position: 'belowBar' as const,
          color: '#26a69a',
          shape: 'arrowUp' as const,
          text: 'BUY',
        },
        {
          time: trade.exitTime as any,
          position: 'aboveBar' as const,
          color: trade.pnl > 0 ? '#26a69a' : '#ef5350',
          shape: 'arrowDown' as const,
          text: trade.pnl > 0 ? `+$${trade.pnl.toFixed(0)}` : `-$${Math.abs(trade.pnl).toFixed(0)}`,
        },
      ])

      // Sort markers by time
      markers.sort((a, b) => (a.time as number) - (b.time as number))
      candleSeriesRef.current.setMarkers(markers)
    }
  }, [backtestResult])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-medium text-gray-300">Chart</span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#2196F3] inline-block" />
            Equity
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#26a69a] inline-block rounded-full" />
            Buy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#ef5350] inline-block rounded-full" />
            Sell
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-1" />
    </div>
  )
}
