export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export interface ValidationError {
  line?: number
  message: string
  code?: string
  severity: 'error' | 'warning'
}

// Pine Script v6 validation based on commercial-builder guard rules
export function validatePineScript(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // V6-001: Check for version declaration
  if (!code.includes('//@version=6') && !code.includes('// @version=6')) {
    if (code.includes('//@version=5') || code.includes('// @version=5')) {
      warnings.push({
        line: 1,
        code: 'V6-MIGRATE',
        message: 'Using Pine Script v5. Consider upgrading to v6 for better type safety and new features.',
        severity: 'warning',
      })
    } else {
      errors.push({
        line: 1,
        code: 'V6-001',
        message: 'Missing //@version=6 annotation. Pine Script v6 requires this declaration.',
        severity: 'error',
      })
    }
  }

  // Check for deprecated study() function
  if (/study\s*\(/.test(code)) {
    errors.push({
      code: 'V6-DEPRECATED',
      message: 'Using deprecated study() function. Use indicator() or strategy() instead.',
      severity: 'error',
    })
  }

  // V6-002: Check for declaration
  const hasStrategy = /strategy\s*\(/.test(code)
  const hasIndicator = /indicator\s*\(/.test(code)
  const hasLibrary = /library\s*\(/.test(code)

  if (!hasStrategy && !hasIndicator && !hasLibrary) {
    errors.push({
      code: 'V6-002',
      message: 'Missing indicator(), strategy(), or library() declaration.',
      severity: 'error',
    })
  }

  // V6-004: Removed transp parameter
  if (/\btransp\s*=/.test(code)) {
    errors.push({
      code: 'V6-004',
      message: 'Found removed v6 parameter `transp =`. Use color.new() instead.',
      severity: 'error',
    })
  }

  // V6-005: Removed when parameter
  if (/\bwhen\s*=/.test(code)) {
    errors.push({
      code: 'V6-005',
      message: 'Found removed v6 order parameter `when =`. Wrap order calls in if blocks instead.',
      severity: 'error',
    })
  }

  // V6-006: linewidth = 0 not allowed
  if (/\blinewidth\s*=\s*0\b/.test(code)) {
    errors.push({
      code: 'V6-006',
      message: 'Found linewidth = 0. Pine v6 requires linewidth >= 1.',
      severity: 'error',
    })
  }

  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push({
      message: `Unbalanced parentheses: ${openParens} opening vs ${closeParens} closing.`,
      severity: 'error',
    })
  }

  // Check for balanced brackets
  const openBrackets = (code.match(/\[/g) || []).length
  const closeBrackets = (code.match(/\]/g) || []).length
  if (openBrackets !== closeBrackets) {
    errors.push({
      message: `Unbalanced brackets: ${openBrackets} opening vs ${closeBrackets} closing.`,
      severity: 'error',
    })
  }

  // Strategy-specific checks
  if (hasStrategy) {
    // STR-001: alertcondition in strategy
    if (/alertcondition\s*\(/.test(code)) {
      errors.push({
        code: 'STR-001',
        message: 'Found alertcondition() in a strategy. Use alert() and/or order-fill alerts instead.',
        severity: 'error',
      })
    }

    // STR-002: Entry without exit
    if (/strategy\.entry\s*\(/.test(code)) {
      if (!/strategy\.(exit|close|close_all)\s*\(/.test(code)) {
        warnings.push({
          code: 'STR-002',
          message: 'Strategy uses strategy.entry() but no exit or close logic was detected.',
          severity: 'warning',
        })
      }
    }

    // STR-003: Missing commission
    if (!/commission_type\s*=/.test(code) || !/commission_value\s*=/.test(code)) {
      warnings.push({
        code: 'STR-003',
        message: 'Strategy declaration does not explicitly set both commission_type and commission_value.',
        severity: 'warning',
      })
    }

    // STR-004: Missing slippage
    if (!/slippage\s*=/.test(code)) {
      warnings.push({
        code: 'STR-004',
        message: 'Strategy declaration does not explicitly set slippage.',
        severity: 'warning',
      })
    }

    // STR-005: calc_on_every_tick warning
    if (/calc_on_every_tick\s*=\s*true/.test(code)) {
      warnings.push({
        code: 'STR-005',
        message: 'calc_on_every_tick = true can make backtests diverge from live behavior.',
        severity: 'warning',
      })
    }

    // STR-006: Missing margin settings
    if (!/margin_long\s*=/.test(code) || !/margin_short\s*=/.test(code)) {
      warnings.push({
        code: 'STR-006',
        message: 'Strategy declaration does not explicitly set margin_long and margin_short. Pine v6 defaults are 100.',
        severity: 'warning',
      })
    }
  }

  // REP-001: varip warning
  if (/\bvarip\b/.test(code)) {
    warnings.push({
      code: 'REP-001',
      message: 'Found varip. This creates realtime-only state that cannot be reproduced cleanly on historical bars.',
      severity: 'warning',
    })
  }

  // REP-002: barstate.isnew
  if (/\bbarstate\.isnew\b/.test(code)) {
    warnings.push({
      code: 'REP-002',
      message: 'Found barstate.isnew. Historical and realtime behavior can differ.',
      severity: 'warning',
    })
  }

  // REP-003: timenow
  if (/\btimenow\b/.test(code)) {
    warnings.push({
      code: 'REP-003',
      message: 'Found timenow. Scripts using wall-clock time necessarily diverge between historical and realtime behavior.',
      severity: 'warning',
    })
  }

  // Plot calls in strategies (warning)
  if (hasStrategy && !code.includes('plot(') && !code.includes('plotshape(') && !code.includes('plotchar(')) {
    warnings.push({
      message: 'Strategy has no plot() calls. Consider adding visual indicators.',
      severity: 'warning',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// Extract strategy name from Pine Script
export function extractStrategyName(code: string): string | null {
  const strategyMatch = code.match(/strategy\s*\(\s*["']([^"']+)["']/)
  if (strategyMatch) return strategyMatch[1]

  const indicatorMatch = code.match(/indicator\s*\(\s*["']([^"']+)["']/)
  if (indicatorMatch) return indicatorMatch[1]

  return null
}
