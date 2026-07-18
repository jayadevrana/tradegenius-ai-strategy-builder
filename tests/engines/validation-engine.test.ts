import { describe, it, expect } from 'vitest'
import { validatePineScript, extractStrategyName } from '@/engines/validation-engine'

describe('Validation Engine', () => {
  describe('validatePineScript', () => {
    it('should pass valid Pine Script v5 code', () => {
      const code = `
//@version=5
strategy("Test Strategy", overlay=true)

rsi = ta.rsi(close, 14)
longCondition = rsi < 30
shortCondition = rsi > 70

if (longCondition)
    strategy.entry("Long", strategy.long)

if (shortCondition)
    strategy.close("Long")

plot(rsi, "RSI")
`
      const result = validatePineScript(code)
      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should fail on missing version declaration', () => {
      const code = `
strategy("Test Strategy", overlay=true)
rsi = ta.rsi(close, 14)
`
      const result = validatePineScript(code)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('version'))).toBe(true)
    })

    it('should fail on deprecated study() function', () => {
      const code = `
//@version=5
study("Test")
`
      const result = validatePineScript(code)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('study()'))).toBe(true)
    })

    it('should warn on missing plot calls', () => {
      const code = `
//@version=5
strategy("Test Strategy", overlay=true)
rsi = ta.rsi(close, 14)
`
      const result = validatePineScript(code)
      expect(result.warnings.some(w => w.message.includes('plot()'))).toBe(true)
    })

    it('should detect unbalanced parentheses', () => {
      const code = `
//@version=5
strategy("Test Strategy", overlay=true
rsi = ta.rsi(close, 14)
`
      const result = validatePineScript(code)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('parentheses'))).toBe(true)
    })

    it('should accept indicator() declaration', () => {
      const code = `
//@version=5
indicator("Test Indicator")
plot(close)
`
      const result = validatePineScript(code)
      expect(result.valid).toBe(true)
    })
  })

  describe('extractStrategyName', () => {
    it('should extract strategy name', () => {
      const code = `//@version=5
strategy("RSI Strategy", overlay=true)`
      expect(extractStrategyName(code)).toBe('RSI Strategy')
    })

    it('should extract indicator name', () => {
      const code = `//@version=5
indicator("My Indicator")`
      expect(extractStrategyName(code)).toBe('My Indicator')
    })

    it('should return null if no declaration found', () => {
      const code = `//@version=5
rsi = ta.rsi(close, 14)`
      expect(extractStrategyName(code)).toBeNull()
    })
  })
})
