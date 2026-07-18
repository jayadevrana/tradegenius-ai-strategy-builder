# Pine v6 Core Reference

## Table of contents
- v6 must-know changes
- strategy rules
- alerts
- data and multi-timeframe notes
- platform limits
- style and organization
- unsupported claims and caveats

## v6 must-know changes

- Use `//@version=6`.
- `int` and `float` values no longer cast implicitly to `bool`. Write `x != 0`, not `if x`.
- `bool` values cannot be `na`. Use a separate enum, int, string, or companion validity flag.
- `request.*()` calls are dynamic by default in v6. If a migrated script changes behavior and does not need dynamic requests, set `dynamic_requests = false` in the declaration.
- `timeframe.period` now includes a multiplier, for example `"1D"` instead of `"D"`.
- The `when` parameter is removed from `strategy.entry()`, `strategy.order()`, `strategy.exit()`, `strategy.close()`, `strategy.close_all()`, `strategy.cancel()`, and `strategy.cancel_all()`. Wrap the order call in an `if` block instead.
- The `transp` parameter is removed. Use `color.new(baseColor, alpha)`.
- Minimum `linewidth` is `1`.
- Default strategy `margin_long` and `margin_short` are `100`. If an old script assumed no margin checks, set these explicitly and explain why.
- Orders above the 9000 limit are trimmed in v6.
- Negative indices are allowed in several array functions.
- `for` loop end boundaries are evaluated dynamically in v6. Be careful when mutating loop bounds.

## Strategy rules

- Make the `strategy()` declaration explicit when the script is meant for trading, not just education.
- Usually specify these properties when relevant:
  - `initial_capital`
  - `default_qty_type` and `default_qty_value`
  - `pyramiding`
  - `commission_type` and `commission_value`
  - `slippage`
  - `calc_on_every_tick`
  - `margin_long` and `margin_short`
  - `process_orders_on_close` when the execution model depends on bar close
- Prefer one clear order model:
  - market on confirmed bar close
  - stop or limit breakout
  - pullback with defined invalidation
- If using `strategy.entry()`, define exit behavior unless the script is explicitly entry-only.
- Avoid discussing win rate alone. Mention risk-reward, trade frequency, market regime, and costs.
- If you show strategy results in publication text, document the properties used to produce them, including commission and slippage.

## Alerts

- Indicators can use `alertcondition()` and `alert()`.
- Strategies should use `alert()` and or built-in order-fill alerts. `alertcondition()` does not create selectable strategy alerts.
- `alertcondition()` messages must be constant strings. Use placeholders for dynamic values.
- `alert()` can build dynamic runtime messages, including JSON payloads.
- For confirmed signals, prefer `alert.freq_once_per_bar_close`.
- For webhook-oriented scripts, keep the payload schema stable across versions.

## Data and multi-timeframe notes

- `request.security()` can pull other symbols, timeframes, or custom ticker contexts.
- Use `syminfo.tickerid` when exchange specificity matters.
- Prefer `request.security_lower_tf()` for lower-timeframe intrabar collections instead of forcing `request.security()` to do lower-timeframe work.
- A declaration-level `timeframe` parameter can sometimes replace repeated `request.*()` calls.
- Pine can request financial, economic, earnings, splits, dividends, footprint, and seed data, but each extra dataset consumes request budget.
- Pine cannot access true Level 2 order-book feeds or train real machine-learning models inside the script runtime. Use OHLCV proxies and say they are proxies.

## Platform limits that affect design

- `request.*()` unique call limit: 40 unique calls for most plans, 64 for Ultimate.
- Lower-timeframe intrabar request limit: up to 100k or 200k bars depending on plan.
- Tables: max 9 visible tables, one per chart position.
- Drawing IDs:
  - `line`, `box`, and `label` max IDs: 500 each
  - `polyline` max IDs: 100
  - only the last 50 drawings of each type show by default unless `max_*_count` is increased
- Collections: 100,000 total elements. Maps hold at most 50,000 key-value pairs.
- Compiled token limit: 100,000 tokens per script, 1,000,000 including imported libraries.
- Variables per scope: 1,000.
- Historical buffer: about 5,000 bars for most series. `open`, `high`, `low`, `close`, and `time` can go to 10,000.
- `xloc.bar_index` drawings can be placed up to 10,000 bars in the past.
- When a script grows complex, reduce repetition, reuse helpers, and gate optional visuals.

## Style and organization

- Recommended order:
  1. version
  2. declaration
  3. constants
  4. grouped inputs
  5. persistent state
  6. types and enums
  7. helper functions
  8. calculations
  9. signals and orders
  10. visuals
  11. alerts
  12. debug tools
- Use `camelCase` for identifiers and `ALL_CAPS` for constants.
- Use suffixes when they help:
  - `LengthInput`
  - `ShowInput`
  - `ColorInput`
  - `TableId`
  - `LongCond` and `ShortCond`
- Keep one source of truth for each core signal. Reuse the same series for plots, alerts, and orders.
- Separate display controls from signal controls.
- Use comments to document assumptions, proxies, and known limits.

## Unsupported claims and caveats

- Do not promise:
  - guaranteed profitability
  - no lag
  - no losses
  - true AI prediction unless an external model is actually connected
  - true order book logic unless using Pine-accessible proxies only
- Market structure tools using pivots have confirmation lag. Say so.
- Backtests on non-standard charts can be misleading. Prefer standard bar-based charts for strategy claims.
