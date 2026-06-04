# Fancy Dashboard Build Rules

Single source of truth for generating `Dashboard-Fancy.html` at the vault root. Read this file in full before building or modifying the dashboard. Do not guess at field names, rendering rules, or architecture — the contracts below are exact.

---

## Architecture Overview

The fancy dashboard uses a **two-layer architecture**:

**Layer 1 — Static HTML** (`Dashboard-Fancy.html`, vault root)
- Contains the weight chart, metric cards, pace/composition bars, progress bars, and coach's notes
- Rebuilt on: morning weigh-in, any change to weight history, explicit user request, date change (new day)
- Do NOT rebuild on every food or exercise log — that's what Layer 2 handles

**Layer 2 — Dynamic JS** (`diet-today.js`, vault root)
- Contains today's macro bars, food log, exercise cards, net calorie line, remaining line, and flags
- Rewritten on: every food log, every exercise log, every correction
- The static HTML `<script>` tag loads this file; updating it auto-refreshes live sections on browser reload

**Why two layers?**

Weight trend data changes once daily. Rebuilding Chart.js and all pace bars on every food log is wasteful and slow. Splitting the work means most logs only rewrite a small JS file while the expensive chart and bars stay cached.

---

## `diet-today.js` Contract

`diet-today.js` lives at the vault root. It assigns exactly one global. This is the same contract as the spec in [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]] — keep the two in sync.

```javascript
window.DIET_TODAY = {
  // Date context
  date: "YYYY-MM-DD",                 // e.g. "2026-05-02"
  dayType: "Training day — 8 km run", // free-text human label, shown in the header
  dayStyle: "normal",                 // machine field; key into STYLE_PROFILES / the Day-Style Registry
  mode: null,                         // legacy free-text banner; null on normal days

  // Targets (numbers from Overview.md / the registry, adjusted for exercise add-back)
  targets: {
    calories: 1942,                   // window floor on window days; the ceiling otherwise
    caloriesCap: null,                // window upper bound (carb-load); null = pure ceiling
    protein: 150,                     // protein floor
    fat: 70,                          // fat cap (ceiling component of the window)
    fatFloor: 35,                     // fat floor; null/absent = treat fat as a pure ceiling
    carbs: 180                        // carb floor (remainder)
  },

  // Weight (only on weigh-in days; null otherwise)
  weight: null,                       // { lbs, kg, bf, mm } or null

  // Meals (one entry per meal logged today)
  meals: [
    // { name: "Breakfast", time: "07:30",
    //   items: [{ item, amount, cal, p, f, c }] }
  ],

  // Exercise (one entry per activity logged today)
  exercise: [
    // { type: "Run", time: "06:15", desc: "Easy 8 km", calories: 600 }
  ]
};
```

### Meal item shape

```javascript
{ item: "Oatmeal", amount: "1 cup", cal: 166, p: 6, f: 4, c: 28 }
```

---

## HARD RULE: Field Name Contract

The HTML reads these exact property names from `window.DIET_TODAY`. **Do not change, abbreviate, or restructure them.** If you add a field, add it to this spec and the HTML renderer simultaneously. If you rename a field, update both in the same step.

| Property | Type | Notes |
|----------|------|-------|
| `date` | string | ISO date |
| `dayType` | string | Free-text human label (header) |
| `dayStyle` | string | Key into `STYLE_PROFILES`; defaults to `normal` if absent |
| `mode` | string\|null | Legacy banner; null on normal days |
| `targets.calories` | number | Adaptive ceiling, or window floor on window days |
| `targets.caloriesCap` | number\|null | Window upper bound; null = pure ceiling |
| `targets.protein` | number | Protein floor |
| `targets.fat` | number | Fat cap |
| `targets.fatFloor` | number\|null | Fat floor; null/absent = fat is a pure ceiling |
| `targets.carbs` | number | Carb floor |
| `weight` | object\|null | `{ lbs, kg, bf, mm }` or null |
| `weight.lbs` | number | |
| `weight.kg` | number | |
| `weight.bf` | number | Body-fat % (optional) |
| `weight.mm` | number | Muscle mass (optional) |
| `meals` | array | `{ name, time, items: [{ item, amount, cal, p, f, c }] }` |
| `exercise` | array | `{ type, time, desc, calories, ... }` |

Totals (calories, protein, fat, carbs) are summed from `meals[].items` by the renderer — they are **not** stored as fields. Exercise burn is summed from `exercise[].calories`.

**Never guess property names.** If the HTML reads `t.calories`, the JS must assign `targets: { calories: … }`, not `caloriesTarget:` or `cal:`.

---

## When to Rebuild HTML vs. Rewrite `diet-today.js`

| Event | Action |
|-------|--------|
| Morning weigh-in logged | Rebuild full HTML + rewrite `diet-today.js` |
| Food log added or corrected | Rewrite `diet-today.js` only |
| Exercise log added or corrected | Rewrite `diet-today.js` only |
| Day date changes (new day) | Rebuild full HTML + reset `diet-today.js` |
| User requests dashboard refresh | Rebuild full HTML + rewrite `diet-today.js` |
| Phase or goal changed in `Overview.md` | Rebuild full HTML |
| Weight history edited | Rebuild full HTML |

Rule of thumb: if only today's food/exercise data changed, rewrite `diet-today.js`. If weight trend data changed, rebuild the full HTML.

---

## Static HTML Sections Spec

Static sections are rendered from weight history and phase config embedded at build time.

### Metric Cards (top row)

Four cards in a responsive row:

1. **Current Weight** — latest weight entry, shown as `X.X lbs / X.X kg`
2. **Lost Since Start** — start weight minus current weight, shown as `−X.X lbs`
3. **Phase** — current phase label from user's `Overview.md`
4. **Pace Range** — trough/raw range shown as `X.X – X.X lbs/wk` (from the 14-day trailing window)

### Weight Chart

Chart.js line chart with four series:

1. **Daily weight** — scatter dots, semi-transparent
2. **7-day moving average** — solid line
3. **Goal weight line(s)** — horizontal dashed line(s) for each goal in `Overview.md`
4. **Trajectory line** — a straight reference line through four reference weights: start weight, first goal weight, second goal weight (if defined), and the projected weight at the current pace on the goal-target date (if a target date is set). Shown as a thin dotted line to distinguish from actual data.

Y-axis in lbs; X-axis shows dates (last 90 days, or full history if shorter). Minimal gridlines.

### Composition Bar (optional)

Rendered only when ≥10 clean body composition entries exist in the 28-day window. Shows FatLb and LeanΔ bars using the single-block highlight algorithm. See Body Composition Bars in [[Knowledge/Jesse-Guidelines/Weight-Tracker-Guidelines]].

### Progress Bars

One bar per user-defined goal weight (from `Overview.md`). Uses fill-to-position algorithm. See Bar Rendering section below.

### Pace/FatLb/LeanΔ Bars

Three bars using the range-as-subset (pace) and single-block highlight (composition) algorithms. Full spec in [[Knowledge/Jesse-Guidelines/Weight-Tracker-Guidelines]].

### Coach's Notes

A text block below the bars. Content is written by the assistant at HTML rebuild time. See Coach's Notes Spec below.

---

## Dynamic Sections Spec

These sections are re-rendered by JavaScript each time the browser loads `diet-today.js`. They operate on `window.DIET_TODAY`.

### Day-Style Resolution: `STYLE_PROFILES`

The HTML holds a `STYLE_PROFILES` map: `dayStyle` → `{ calType, fatType, carbInRemaining }`. It encodes **bar types only** — the target *numbers* come from `DIET_TODAY.targets`. This map must stay in sync with the canonical Day-Style Registry in [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]] (the HTML cannot read that markdown table). When a style is added to the registry, add the matching row here.

```javascript
var STYLE_PROFILES = {
  'normal':              { calType: 'ceiling', fatType: 'window',           carbInRemaining: true  },
  'long-run':            { calType: 'ceiling', fatType: 'window',           carbInRemaining: true  },
  'endurance':           { calType: 'ceiling', fatType: 'window',           carbInRemaining: true  },
  'refeed':              { calType: 'ceiling', fatType: 'window',           carbInRemaining: true  },
  'sick':                { calType: 'ceiling', fatType: 'window',           carbInRemaining: true  },
  'carb-load-training':  { calType: 'window',  fatType: 'minimize-ceiling', carbInRemaining: false },
  'carb-load-race':      { calType: 'window',  fatType: 'minimize-ceiling', carbInRemaining: false },
  'fasting':             { calType: 'ceiling', fatType: 'floor',            carbInRemaining: true  }
};
```

Resolution: explicit `dayStyle` wins → else detect a `CARB-LOAD` marker in `dayType` (back-compat) → else `normal`.

### Macro Bars

Rendered from `DIET_TODAY.targets` plus the resolved style. One bar per metric, 20 blocks each (12×16 px). Each bar carries a **goal chip** (a small colored marker showing its type), and a single compact **legend** sits at the bottom of the panel.

- **Calories** — `calType` (`ceiling` normally; `window` on carb-load, using `targets.calories` floor and `targets.caloriesCap`)
- **Net calories** — gray bar, shown only when total exercise burn > 0
- **Protein** — floor
- **Carbs** — floor
- **Fat** — `fatType` (`window` with `targets.fatFloor`/`targets.fat`; `minimize-ceiling` on carb-load; `floor` on fasting)

**Goal chips** — first token on each bar's info line: green `≥` (floor), blue `≤` (cap/ceiling), amber `↕` (window).

**Color zones** (bar colors are **never** time-gated):

*Floor* (percent of floor): 0–49% red · 50–79% amber · 80–100% green · >100% green.
*Ceiling / minimize-ceiling* (percent of cap): 0–79% green · 80–100% amber · >100% red.
*Window* (vs floor and cap): below floor **red** · floor–80% of cap green · 80–100% of cap amber · over cap red. A window colors red when too **low**, unlike a pure ceiling.

**Legend** — one compact line (~10px) at the bottom of the macro panel, each item fully colored (symbol *and* text the same color): `≥ floor` (green) · `≤ cap` (blue) · `↕ window` (amber).

### Time-Gated Low Flags (HARD RULE)

Under-floor textual flags (protein low, fat under floor, carbs low) render **only after `[LOW_FLAG_HOUR]`** (default 16): `if (new Date().getHours() >= LOW_FLAG_HOUR) …`. Over-cap flags (fat over cap, calories over) are **not** gated. **Bar colors are never gated** — only the textual flags. Define `LOW_FLAG_HOUR` as a single configurable constant in the script. Full flag table in [[Knowledge/Jesse-Guidelines/Diet-Dashboard-Guidelines]].

| Flag | Trigger | Gated |
|------|---------|-------|
| `← low protein` | protein < ~90% of floor | after `LOW_FLAG_HOUR` |
| `← fat under floor` | fat < `fatFloor` | after `LOW_FLAG_HOUR` |
| `← low carbs` | carbs < floor | after `LOW_FLAG_HOUR` |
| `← fat over cap` | fat > `fat` cap | never gated |
| `← over calorie target` | calories over ceiling / window cap | never gated |

### Food Log

Rendered from `DIET_TODAY.meals`. One table per meal: header row, item rows (Item, Amount, Cal, P, F, C), subtotal, grand total. Totals are summed by the renderer.

### Exercise Cards

Rendered from `DIET_TODAY.exercise`. One card per activity: type, time, description, stats, calories.

### Net Calorie Line

Shown only when total exercise burn > 0. Displays net intake (total − burn) against the calorie target, in gray.

### Remaining Line

Text: `Remaining: ~X cal, Xg protein`. From `targets.calories − total calories` and `targets.protein − total protein` (floored at 0).

---

## HARD RULE: Error Isolation

Chart.js and the food renderer **must** run in separate `try/catch` blocks. If one fails, the other must still render.

```javascript
// Chart block — isolated
try {
  const ctx = document.getElementById('weightChart');
  if (ctx) {
    new Chart(ctx, { /* ... */ });
  }
} catch (e) {
  console.error('Chart render failed:', e);
  const container = document.getElementById('chart-container');
  if (container) container.innerHTML = '<p class="error">Chart unavailable</p>';
}

// Food renderer block — isolated, always runs regardless of chart outcome
try {
  renderFoodLog(window.DIET_TODAY);
  renderMacroBars(window.DIET_TODAY);
  renderExerciseCards(window.DIET_TODAY);
} catch (e) {
  console.error('Food renderer failed:', e);
  const section = document.getElementById('food-section');
  if (section) section.innerHTML = '<p class="error">Food data unavailable</p>';
}
```

**All DOM access must be null-guarded:**

```javascript
// Correct
const el = document.getElementById('card-weight-value');
if (el) el.textContent = data.weightLbs + ' lbs';

// Wrong — crashes silently if element is absent
document.getElementById('card-weight-value').textContent = data.weightLbs + ' lbs';
```

**Never use `textContent` on a container that has child elements** — it destroys them. Target the specific leaf node.

```javascript
// Wrong — destroys child elements inside the card
document.getElementById('card-weight').textContent = '185.2 lbs';

// Correct — targets the value span inside the card
document.getElementById('card-weight-value').textContent = '185.2 lbs';
```

---

## Bar Rendering Algorithms

### Pace Bar: Range-as-Subset

Used for: weight pace (trough vs. raw).

```
scale_cap  = phase.scaleCap        // from Overview.md phase config
block_size = scale_cap / 20

low  = min(troughPace, rawPace)
high = max(troughPace, rawPace)

for i in 0..19:
    v_center = (i + 0.5) * block_size
    if low <= v_center <= high:
        block[i] = zone_color(v_center)   // TOO_SLOW / SLOW / IDEAL / TOO_FAST
    else:
        block[i] = EMPTY
```

See [[Knowledge/Jesse-Guidelines/Weight-Tracker-Guidelines]] for zone color definitions and the failed-approaches history explaining why this design was chosen.

### FatLb and LeanΔ Bars: Single-Block Highlight

Used for: fat loss pace and lean mass change rate.

```
scale_cap  = 2.0          // lbs/week (fat); 1.0 for lean mass change
block_size = scale_cap / 20

target_i = argmin over i of |((i + 0.5) * block_size) - pace|

for i in 0..19:
    block[i] = (i == target_i) ? zone_color(pace) : EMPTY
```

One colored block; all others empty. Do not apply range-as-subset to composition bars.

### Progress Bars: Fill-to-Position

Used for: progress toward each user-defined goal weight.

```
fill_pct    = (start_weight - current_weight) / (start_weight - goal_weight)
fill_pct    = clamp(fill_pct, 0.0, 1.0)
filled      = round(fill_pct * 20)

for i in 0..19:
    block[i] = (i < filled) ? zone_color(troughPace) : EMPTY
```

Color is from trough pace zone (conservative signal). Label: `X.X / Y lbs to Z (P%)`.

---

## Verification Step

After generating or updating the HTML dashboard, count colored blocks:

| Bar | Expected colored blocks |
|-----|------------------------|
| Pace | 1–4 (if 0: pace outside scale range; if 20: scale_cap too low) |
| FatLb | Exactly 1 (if composition data available) |
| LeanΔ | Exactly 1 (if composition data available) |
| Each progress bar | 0–20, proportional to percent complete |

If the pace bar has 0 blocks, check whether `troughPace` and `rawPace` were computed from the correct 14-day window. If it has all 20 blocks, the phase's `scaleCap` needs to be raised in `Overview.md`.

---

## Coach's Notes Spec

Coach's notes appear in the static HTML below the bars. They are regenerated at every HTML rebuild.

### Content Rules

- 2–4 sentences; plain prose; no headers or bullets
- Tone: neutral, observational — describe patterns without advice or motivation
- Reference actual values where meaningful ("pace range 0.9–1.1 lbs/wk, consistent for 10 days")
- Do not recommend actions; let the data speak
- Do not reference user-specific names, race dates, or values not derivable from the data object
- **Surface a floor-miss trend** when one is active — a floor missed on `[FLOOR_MISS_COUNT]`+ of the trailing `[FLOOR_MISS_WINDOW]` logged days (defaults 3 of 7; protein < ~90% of floor, fat < floor). State it as a pattern ("protein under floor 4 of the last 7 days"), not a single-day nag. Definition in [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]].

### Continuity Rules

Before writing new notes:

1. Read the last 7 entries from `Knowledge/Health/Coach-Notes-Log.md`
2. Identify running themes (e.g., "pace has been slow for 3 weeks", "composition stable")
3. Carry forward active themes; retire themes whose underlying data no longer supports them
4. Introduce new themes only when data clearly warrants it — not one-day noise

This prevents notes from contradicting prior advice or oscillating on day-to-day variance.

### After Writing

After rendering the dashboard, append to `Knowledge/Health/Coach-Notes-Log.md`:

```markdown
## YYYY-MM-DD

[exact notes rendered on the dashboard]

Context: [brief data summary — pace range, current weight, composition trend if available]
```

---

## Design Rules

1. **Self-contained HTML** — no external CSS, no external fonts; CDN Chart.js only (pin the major version)
2. **File location** — `Dashboard-Fancy.html` at vault root, not inside any subdirectory
3. **Light/dark mode** — reads `prefers-color-scheme`; toggle button available
4. **Block sizes** — 12×16 px per block for all bar visualizations
5. **Zone colors (light mode):**
   - TOO SLOW: `#ef4444` (red)
   - SLOW: `#f59e0b` (amber)
   - IDEAL: `#22c55e` (green)
   - TOO FAST: `#3b82f6` (blue)
   - Empty block: `#e5e7eb` (light gray)
   - Net calories bar: `#9ca3af` (medium gray, `░`-style)
6. **Dark mode** — use slightly desaturated variants; maintain contrast ratios
7. **No emoji** in the HTML dashboard — use colored blocks only
8. **No hardcoded user values** — all targets, phases, and goals come from the external data files (`diet-today.js`, etc.) at load time; none are hardcoded in the HTML shell. Adding the day-style `STYLE_PROFILES`, goal chips, legend, and gating must not introduce data into the shell — `STYLE_PROFILES` is *structural* (bar types only), not user data. Keep each renderer in its own `try/catch` and null-guard every `getElementById`.
