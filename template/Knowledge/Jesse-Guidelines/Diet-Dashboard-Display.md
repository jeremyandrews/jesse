# Diet Dashboard Display

Read-only status display — used when the user asks about their tracking state without logging new data.

## Triggers

- "Where am I today?"
- "Show my tracking" / "show my dashboard"
- Weight progress queries without new data
- "How am I doing?" in a nutrition context

## Flow

1. **Read `diet-today.js`** — extract today's totals (calories, protein, fat, carbs, exercise), `targets`, and `dayStyle`
2. **Resolve bar types** — from the Day-Style Registry in [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]] (`dayStyle` → floor/ceiling/window per macro)
3. **Compute the adaptive calorie target** — the add-back-with-haircut formula from [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]] (`base + add-back × (burn × (1 − haircut))`)
4. **Render ASCII dashboard in chat** — per [[Knowledge/Jesse-Guidelines/Diet-Dashboard-Guidelines]]: goal chips, floor/ceiling/window colors, bottom legend, time-gated low flags
5. **Weight tracker** (optional) — show if it's a weigh-in day OR if the user explicitly asks about weight/progress

## Rules

- **Display only.** Never modify xlsx, daily journal, `diet-today.js`, or any config files.
- **No dashboard if no data.** If `diet-today.js` doesn't exist or has no meals, say so rather than rendering empty bars.
- **Inline and HTML must agree.** The ASCII receipt and `Dashboard-Fancy.html` use the same targets, bar types, color logic, and the same `[LOW_FLAG_HOUR]` time-gate — they must show the same flags.
- **Time-gate low flags.** Under-floor "low" flags render only after `[LOW_FLAG_HOUR]` (default 16:00); over-cap flags are never gated; bar colors are never gated. See [[Knowledge/Jesse-Guidelines/Diet-Dashboard-Guidelines]].
- **Fancy dashboard link.** If the user has `Dashboard-Fancy.html`, mention they can also open it in a browser for the visual version.
- **Context-sensitive.** If the user asks "how am I doing?" outside a nutrition context, respond conversationally — don't force the dashboard.
