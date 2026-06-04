# Diet Dashboard Guidelines

This guide specifies how to render daily nutrition dashboards in your vault. Dashboards reflect intake against adaptive targets, use emoji bars for quick visual scanning, and flag zones of attention without nagging.

## Core Purpose

The diet dashboard is your **current-state summary** for any given day. It answers:
- How much intake relative to target?
- Which macros need attention before the day ends?
- What's the net balance (intake minus exercise)?
- How am I tracking against my goal pace (loss, maintenance, recomp, or gain)?

Dashboards appear in two contexts:
1. **Daily journal** (`todo-list/Projects/Diet/YYYY-MM-DD.md`) — rendered at the top after your morning weigh-in and updated throughout the day.
2. **Chat display** — when you ask about your nutrition state without logging new data, render this dashboard format in the response.

Dashboards do not appear unless the conversation is food-related.

---

## Dashboard Format

### Header

```
=== Mon Mar 30 | 8.5km run, 600 cal | Target: 1,942 ===
```

Components:
- **Day and date:** Full weekday and date (e.g., `Mon Mar 30`)
- **Exercise summary:** Distance/duration and estimated calories burned (if logged)
- **Calorie target:** The adaptive target for today (baseline plus exercise adjustment)

### Macro Bars (20 chars wide)

Each bar carries a **goal chip** — a colored marker showing its metric type (floor `≥`, ceiling `≤`, window `↕`) — so the type is readable at a glance. A compact, fully-colored **legend** sits at the bottom of the panel.

```
Cal    ≤  🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜    625 / 1,942   (32%)
  Net    ░░░░░░░░░░░░░░░░░░░░     25 / 1,942         ← after 600 cal run
Prot   ≥  🟨🟨🟨🟨🟨🟨🟨⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜     51g / 150g    (34%)
Carbs  ≥  🟥🟥⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜     18g / 180g    (10%)
Fat    ↕  🟥🟥🟥🟥🟥⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜     18g / 35–70g  (under floor)

≥ floor (at or above) · ≤ cap (at or under) · ↕ window (in range)
Remaining (baseline): ~1,317 cal, 99g protein
```

The chip is the first token after the label; in chat use the symbol (`≥` `≤` `↕`). In the HTML it is a small colored chip — green floor, blue cap, amber window (see [[Knowledge/Jesse-Guidelines/Fancy-Dashboard-Build]]).

#### Row Layout

**Calories** — ceiling on normal days, window on high-fuel days (the `dayStyle` decides; see the Day-Style Registry in [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]]).
- Line 1: full intake vs the adaptive target
- Line 2 (indented `Net`): intake minus the discounted exercise burn (informational, always ░ gray, shown only when exercise is logged)

**Protein** — floor. Goal from `Overview.md`.

**Carbs** — floor (remainder). Goal from `Overview.md`.

**Fat** — window: a floor *and* a cap. Shows `actual / floor–cap`. On carb-load styles it becomes a minimize-it ceiling instead.

**Legend** (bottom of the panel) — one compact line, each item fully colored.

**Remaining line** (informational, not a bar) — summarizes unmet baseline calories and the protein gap.

#### Bar Rules

**Physical:**
- Each bar is exactly **20 characters** wide
- Empty position = `⬜`
- Filled positions all use the **same color** for that metric (consistency rule)
- Percentage: `(actual / target) × 100`, rounded to nearest integer
- If the percentage rounds to 100%, the bar **must** be fully filled (20/20 blocks)

#### Color Zones by Metric Type

The type comes from the macro model ([[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]]); bar colors are **never** time-gated (only the textual flags are).

**Floor** (protein, carbs) — percent of the floor:
- **0–49%:** 🟥 red
- **50–79%:** 🟨 yellow
- **80–100%:** 🟩 green
- **>100%:** 🟩 green (with optional `[+Ng over]` badge)

**Ceiling** (calories on normal days; fat on carb-load styles) — percent of the cap:
- **0–79%:** 🟩 green
- **80–100%:** 🟨 yellow (approaching limit)
- **>100%:** 🟥 red + overage badge

**Window** (fat normally; calories on high-fuel days) — relative to floor *and* cap. Unlike a pure ceiling, a window colors **red when too LOW**:
- **below floor:** 🟥 red (too low)
- **floor to 80% of cap:** 🟩 green (in window)
- **80–100% of cap:** 🟨 yellow (approaching cap)
- **over cap:** 🟥 red

**Net calories line** — always ░ light-gray blocks, never colored, no goal zone; only appears when exercise is logged.

---

## Adaptive Calorie Target

The calorie target rises with logged exercise in two steps — discount the tracker's overestimate, then add back only half — so day-type categories aren't needed for rest vs. training. Full rationale and the parameter table are in [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]].

### Formula

```
Calorie target = [BASE_TARGET] + [ADD_BACK_RATE] × ([LOGGED_EXERCISE_CAL] × (1 − [TRACKER_HAIRCUT]))
```

- `[TRACKER_HAIRCUT]` (default 0.25): wearables and machines overestimate burn — discount first.
- `[ADD_BACK_RATE]` (default 0.50): eat back only half of the discounted burn.
- `[BASE_TARGET]`: from the setup wizard ([[Knowledge/Jesse-Guidelines/Diet-Setup-Wizard]]), defined in `Overview.md`.

**No exercise** → target stays at `[BASE_TARGET]`; single calorie line (Cal, no Net).
**Exercise logged** → both lines appear: Cal (colored, vs the adaptive target) and Net (gray, informational).

### Example Scenarios

| Base | Logged burn | After haircut (×0.75) | After add-back (×0.50) | Target |
|------|-------------|-----------------------|------------------------|--------|
| `[BASE_TARGET]` | 600 | 450 | 225 | base + 225 |
| `[BASE_TARGET]` | 800 | 600 | 300 | base + 300 |
| `[BASE_TARGET]` | 1,500 | 1,125 | ~563 | base + 563 |
| `[BASE_TARGET]` | 0 | 0 | 0 | base (rest day) |

---

## Two Calorie Lines (When Exercise is Logged)

**Cal line (primary, colored)**
- Renders as: intake vs **adaptive target**
- Color zone: ceiling metric (0–79% green, 80–99% yellow, ≥100% red)
- Purpose: main tracking line — shows if you're in fuel balance
- Flag rule: if ≥90% with meals remaining → `← high` (see Flags below)

**Net line (secondary, informational, always gray)**
- Renders as: intake − exercise calories vs **baseline target**
- Always ░ (light gray blocks, never colored)
- Not a goal zone, just data
- Purpose: show what you've consumed net of activity — useful for understanding recovery fuel
- **Important:** Do not suggest "eating back" exercise calories. The adaptive target already accounts for the adjustment.

### Example

```
Cal    ≤  🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜    625 / 1,942   (32%)
  Net    ░░░░░░░░░░░░░░░░░░░░     25 / 1,942         ← net after 600 cal exercise
```

- Intake: 625 cal; logged burn: 600 cal
- Adaptive target: 1,942 (base + 0.50 × (600 × 0.75) = base + 225)
- Cal line: 625 / 1,942 = 32% (green, well under target)
- Net line: (625 − 600) / 1,942 = 25 / 1,942 (gray, informational — consumed 25 cal net of activity)

---

## Flags

Flags are **one-line markers** at the end of rows. They state facts; they don't lecture.

### Time-Gated Low Flags (HARD RULE)

Under-floor "you're low" flags are noise mid-day — an unfilled floor before the last meal is expected, not a problem. **Gate them to render only after `[LOW_FLAG_HOUR]` (default 16:00 local).** Over-cap flags are never gated — going over is a problem whenever it happens. **Bar colors are never gated, only the textual flags.**

| Flag | Trigger | Gated? |
|------|---------|--------|
| Protein low | protein < ~90% of floor | yes — after `[LOW_FLAG_HOUR]` |
| Fat under floor | fat < floor | yes — after `[LOW_FLAG_HOUR]` |
| Carbs low | carbs < floor | yes — after `[LOW_FLAG_HOUR]` |
| Fat over cap | fat > cap | no |
| Calories over | calories > ceiling (or over the window cap) | no |
| Calories high | calories ≥ 90% of ceiling with meals remaining | no |

In the HTML, the gate is `new Date().getHours() >= [LOW_FLAG_HOUR]` (see [[Knowledge/Jesse-Guidelines/Fancy-Dashboard-Build]]). Inline (chat) ASCII receipts use the same gate from the current local hour so the two displays agree.

### Behavior

- Flags appear inline on the affected row
- No explanations or suggestions — the flag is the nudge
- A flag that no longer applies is removed on the next dashboard update
- Multiple flags per row are fine

### Floor-Miss Trend (across days)

A single under-floor day is an incident; a floor missed on `[FLOOR_MISS_COUNT]`+ of the trailing `[FLOOR_MISS_WINDOW]` logged days (defaults 3 of 7) is a trend. It is **not** a per-day flag — it surfaces in the coach's notes and the weekly report. Full definition in [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]].

---

## Three-View Sync

Every nutrition log (meal, exercise, weigh-in) must update three places:

1. **Daily journal** (`todo-list/Projects/Diet/YYYY-MM-DD.md`)
   - Add meal/exercise entry
   - Rerender the dashboard at the top

2. **Spreadsheet(s)** (optional but recommended)
   - Food log: `food-log.xlsx` at workspace root
   - Exercise log: `exercise-log.xlsx` at workspace root
   - Use these for long-term trend analysis outside the vault

3. **Chat dashboard** (when you query state without logging)
   - Render the dashboard in the response using the same format
   - No dashboard unless conversation is nutrition-related

Syncing prevents drift and keeps all tools speaking the same language.

---

## Weight Tracker Integration

When you log a weigh-in, the dashboard expands to include weight context. Reference [[Knowledge/Jesse-Guidelines/Weight-Tracker-Guidelines]] for the full spec.

**Brief integration:**
- Render weight progress bars below the macro bars on weigh-in days
- Show pace (regression-based rate of change)
- Display optional body composition (if tracked)
- Example:

```
Weight   ████████░░░░░░░░░░░░  210.5 / 175.0 goal  (−35.5 lbs)
Pace (7d): −0.8 lbs/wk → ETA goal in 44 weeks
```

---

## Fancy Dashboard

Fancy dashboard build rules live in [[Knowledge/Jesse-Guidelines/Fancy-Dashboard-Build]]. That file is the single source of truth for generating and updating `Dashboard-Fancy.html`.

---

## Day Styles (Event-Prep, Refeed, Sick, Carb-Load)

Temporary target adjustments — carb-loading, refeed/diet-break, illness, endurance fueling, fasting — are handled by the **Day-Style Registry**, the canonical table in [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]]. The registry maps each `dayStyle` to its bar *types* (which macro is a floor, ceiling, or window); the target *numbers* come from `targets` in `diet-today.js`.

**How it drives the dashboard:**
- Set `dayStyle` in `diet-today.js` (e.g. `"refeed"`, `"carb-load-race"`); the human-readable `dayType` shows in the header.
- The HTML's `STYLE_PROFILES` map (kept in sync with the registry) resolves the bar types — e.g. on carb-load, calories become a **window** and fat a **minimize-it ceiling**; on a normal day, calories are a ceiling and fat a window.
- The same numbers and types are used by the inline ASCII receipt and the HTML, so the two always agree.

No `dayStyle` → `normal` (calories ceiling, fat window, protein and carbs floors).

---

## Behavior Rules

These principles keep dashboards useful without noise.

### Don't Nag

- Flags state facts; they don't give advice
- No "you should eat more carbs" lectures — the ← low flag on the carbs line is the nudge
- User interprets the flag in context and decides what to do

### Don't Recalculate Targets

- Base target and adjustment rate are user-defined in `Overview.md`
- Your job: apply the formula, render the dashboard, flag zones
- Don't suggest changes to targets — user owns that

### Estimates from General Knowledge

- If a meal is estimated (e.g., "a bagel with cream cheese"), use typical nutrition facts, not APIs
- Store estimates in the daily log so user can refine them later
- Always note estimates: `[est. 350 cal]`

### Only Show Dashboard When Food-Related

- If the day's conversation isn't about nutrition, don't render the dashboard unprompted
- If user asks "How am I doing today?" and it's not in a nutrition context, respond conversationally without the dashboard
- Render on request or when logging food

### Food Identification: Check Recent Entries First

- If user logs "toast with peanut butter," check the daily log for recent similar meals (same day or same week)
- Reuse nutrition estimates where possible to maintain consistency
- Fall back to general knowledge only if no recent match exists

---

## Cookbook Integration

If you maintain a tracked recipe collection (e.g., `Knowledge/Cookbook/Recipes/`), integrate it with logging.

**When active:**
- If user logs from a tracked recipe name (e.g., "Sourdough Focaccia"), auto-populate nutrition from the recipe file
- Logging becomes: recipe name + quantity → auto-filled nutrition + dashboard update
- User can override nutrition if needed (e.g., "that focaccia is smaller than usual")

**When not active:**
- Ignore cookbook; estimate from general knowledge

**Example:**
```
Logged: 1 slice Sourdough Focaccia (from Knowledge/Cookbook/Recipes/Focaccia.md)
Nutrition: 240 cal, 28g carbs, 6g protein, 12g fat [from recipe]
Dashboard updated.
```

---

## Summary: Daily Workflow

1. **Morning weigh-in:** Log weight → dashboard shows weight progress + pace
2. **Breakfast:** Log meal → dashboard updates; check protein flag
3. **Exercise:** Log activity (distance, duration, estimated calories) → adaptive target rises, Net line appears
4. **Lunch:** Log meal → dashboard updates; check carbs flag on exercise days
5. **Throughout day:** Snacks and meals update the dashboard
6. **Evening:** Last dashboard of the day shows where you landed; informal notes on how you feel
7. **Next morning:** New day file, new dashboard, cycle repeats

Each log is a data point; the dashboard is your mirror. No rules except the ones you set in `Overview.md`.
