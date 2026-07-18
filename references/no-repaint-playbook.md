# No-Repaint Playbook

Use this reference when the script requests higher-timeframe data, intrabar behavior, pivots, or realtime alerts.

## Default posture

- Prefer confirmed-bar signals by default.
- If the user wants a faster live mode, make it explicit that the mode can repaint or diverge from historical backtests.
- Separate `confirmed` and `live` behavior with an input only when the use case truly benefits from both.

## Current timeframe confirmation

- Gate actionable signals with `barstate.isconfirmed` when you need historical and realtime behavior to match on the chart timeframe.
- Prefer alerts that trigger on bar close when the user wants reproducible signals.

## Higher-timeframe requests

Use confirmed higher-timeframe data by default.

```pine
noRepaintSecurity(symbol, timeframe, expression) =>
    request.security(symbol, timeframe, expression[1], lookahead = barmerge.lookahead_on)
```

Guidance:
- The offset and `lookahead_on` are a pair. Removing either breaks the confirmed higher-timeframe pattern.
- If the request needs multiple returned values, use separate confirmed requests or wrap the values in a user-defined type and request that object.
- If the user explicitly wants live higher-timeframe values, say that the values can change before the higher-timeframe bar closes.

## Lower-timeframe logic

- Prefer `request.security_lower_tf()` for lower-timeframe collections.
- Intrabar models can be useful, but they make the script more complex and can widen the gap between clean historical behavior and live execution details.
- If you rely on lower-timeframe arrays, explain how the strategy or indicator uses them and what the performance cost is.

## Repaint risk sources

Treat these as repaint or backtest-divergence hazards unless the user explicitly wants them:

- `calc_on_every_tick = true`
- `varip`
- `timenow`
- `barstate.isnew`
- unconfirmed higher-timeframe `request.security()` values
- plotting or labeling into the past without explanation
- strategy claims made on non-standard charts

## Pivots and structure tools

- `ta.pivothigh()` and `ta.pivotlow()` confirm only after the right-side bars exist.
- Do not present pivot-based signals as if they were known at the pivot bar in real time.
- If the user wants structure labels at the pivot location, explain that the visual location is shifted but the information was confirmed later.
- A clean commercial script states the confirmation lag clearly in the usage notes or publication text.

## Alerts

- For reproducible alerts, use `alert.freq_once_per_bar_close`.
- If the script offers aggressive live alerts, state that they can disappear or change before bar close.
- For strategies, prefer order-fill alerts and targeted `alert()` calls instead of trying to force indicator-style alert conditions.

## Past plotting and offsets

- Negative offsets or back-shifted plots can be valid for special cases such as projection or classic indicator conventions, but they need explicit disclosure.
- Do not hide future information by drawing signals earlier than they are actually known.

## Strategy realism

- Closed-bar strategies are the safest default for publication-quality work.
- If using `calc_on_every_tick = true`, explain that backtests will not match live behavior.
- Prefer standard bar-based charts for strategy claims.

## Suggested disclosure text

Use wording like this when needed:

- "This script defaults to confirmed-bar logic."
- "Higher-timeframe values are requested in confirmed mode to reduce repainting."
- "Pivot labels are drawn at the pivot location, but the pivot is only confirmed after the right-side lookback completes."
- "The optional live mode is faster but can repaint before bar close."
