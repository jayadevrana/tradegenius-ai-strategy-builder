'use client'

import { useState, useCallback, useEffect } from 'react'
import type { StrategyDefinition } from '@/types/strategy'

interface Strategy {
  id: string
  name: string
  description: string | null
  prompt: string
  pineScript: string
  strategyJson: StrategyDefinition | null
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export function useStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStrategies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/strategies')
      if (!response.ok) throw new Error('Failed to fetch strategies')
      const data = await response.json()
      setStrategies(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const saveStrategy = useCallback(async (strategy: {
    name: string
    description?: string
    prompt: string
    pineScript: string
    strategyJson?: StrategyDefinition | null
    tags?: string[]
    isPublic?: boolean
  }) => {
    const response = await fetch('/api/strategies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy),
    })

    if (!response.ok) throw new Error('Failed to save strategy')
    const saved = await response.json()
    setStrategies(prev => [saved, ...prev])
    return saved
  }, [])

  const deleteStrategy = useCallback(async (id: string) => {
    const response = await fetch(`/api/strategies/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete strategy')
    setStrategies(prev => prev.filter(s => s.id !== id))
  }, [])

  const updateStrategy = useCallback(async (id: string, updates: Partial<Strategy>) => {
    const response = await fetch(`/api/strategies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) throw new Error('Failed to update strategy')
    const updated = await response.json()
    setStrategies(prev => prev.map(s => s.id === id ? updated : s))
    return updated
  }, [])

  useEffect(() => {
    fetchStrategies()
  }, [fetchStrategies])

  return {
    strategies,
    loading,
    error,
    fetchStrategies,
    saveStrategy,
    deleteStrategy,
    updateStrategy,
  }
}
