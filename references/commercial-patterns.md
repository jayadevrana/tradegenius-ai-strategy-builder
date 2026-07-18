# Commercial-Grade Patterns for Pine v6

Sampled patterns from public v6 scripts and TradingView documentation. Use these as design signals, not as code sources.

## Pattern summary

- Start with a strong use case statement.
- Tell users the intended market and timeframe.
- Group inputs by module: signal, filters, risk, display, alerts, and debug.
- Use one clean main visual and one optional dashboard.
- Add explicit alerts for every actionable event.
- Include limitations and a grounded disclaimer section.

## Representative public-script patterns

### Account Guardian

Common traits:
- pivot-based swing detection
- risk-reward math
- box-based stop-loss and take-profit overlay
- position sizing
- table dashboard
- multiple alert conditions

Use this pattern when building execution-planning overlays, risk-reward tools, or trade validation dashboards.

### Order Flow Trading System v6

Common traits:
- layered pipeline: features -> regime -> signal -> risk -> display
- proxy-based microstructure features because Pine lacks true Level 2
- adaptive or scored multi-factor engine
- separate subpanel for heavy analytics

Use this pattern when building advanced analytical indicators or regime-aware score systems.

### Market Structure

Common traits:
- hierarchical swing states
- arrays and labels for confirmed pivots
- promotion logic across short, intermediate, and long structure

Use this pattern when building structure, BOS, CHOCH, liquidity, or pivot frameworks.

### Alerts v6

Common traits:
- multi-filter signal stack
- session and day gating
- JSON or webhook integration

Use this pattern when automation or alert distribution is part of the product.

### Liquidity Maxing

Common traits:
- structure engine plus confluence scoring
- dynamic risk state
- custom types for state management

Use this pattern when the system needs multiple independent filters with weighted scoring.

### Quality-Controlled Trend Strategy

Common traits:
- closed-bar discipline
- commission and slippage included
- fixed risk
- one-position logic
- explicit anti-repaint posture

Use this as the baseline tone for any strategy meant to look serious.

## Architecture templates

### Indicator template

1. Declaration and grouped inputs
2. Core series calculations
3. Optional filters
4. Signal conditions
5. State tracking
6. Visual layer
7. Alert layer
8. Debug layer

### Strategy template

1. `strategy()` properties
2. Feature and filter calculations
3. Entry conditions
4. Position sizing
5. Exit and invalidation logic
6. Visual confirmation layer
7. Alert layer
8. Results caveats

### Multi-factor system template

1. Feature engine
2. Regime filter
3. Composite scoring
4. Risk engine
5. Execution rules
6. Dashboard
7. Alerts
8. Debug traces

## UX defaults

- Put frequently adjusted inputs first.
- Hide advanced tuning behind a separate group.
- Use a dashboard only for decision-critical values.
- Keep chart clutter low. Make secondary visuals toggleable.
- If the script draws boxes or lines, reuse IDs where possible.
- Provide a `showDebugInput` toggle for development-only plots.

## Alert and webhook patterns

- Fire one alert per actionable event.
- Use stable event names, for example:
  - `Long setup`
  - `Short setup`
  - `Long invalidated`
  - `TP hit`
  - `SL hit`
  - `Regime changed`
- For indicator alerts with static messages, use `alertcondition()` plus placeholders.
- For dynamic JSON or strategies, use `alert()`.
- Example JSON payload for `alert()`:

```json
{"event":"long_entry","ticker":"{{ticker}}","tf":"{{interval}}","time":"{{time}}","price":{{close}}}
```

- If the payload depends on runtime variables, build it with `alert()`, not `alertcondition()`.

## Strategy realism checklist

- Include commission and slippage.
- Prefer confirmed-bar entries by default.
- Define exit logic.
- Avoid curve-fit language.
- State intended market and timeframe.
- State known weak regimes.
- Do not present win rate without context.
- Do not hide repainting or intrabar behavior.

## Publication feel

A serious script page usually includes:
- a plain-language overview
- a core logic or module summary
- an input overview
- alerts and automation notes
- intended market and timeframe
- limitations
- disclaimer
- update notes when changed
