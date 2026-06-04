# Sunday Weekly Diet Analysis

Weekly accountability report. Runs every Sunday as part of start-of-day routine.

## Inputs

- Last 7 daily diet journals (`Projects/Diet/YYYY-MM-DD.md`)
- `exercise-log.xlsx` (week's activity)
- `Projects/Diet/Overview.md` (targets and goals)
- Previous weekly report (for trend comparison)
- Any health notes from the week

## Chat Analysis

Deliver in conversation with four sections — honest, not gentle:

1. **The Great** — measurable wins only (hit protein 6/7 days, dropped 1.2 lbs, ran 3x). No participation trophies.
2. **The Good** — solid, trending right, not yet great (deficit held most days, added a strength session, cooked more).
3. **The Bad** — specific shortfalls with numbers (protein averaged 118g vs 150g target, missed 2 exercise days, snacking after dinner 3 nights).
4. **The Ugly** — single biggest issue, quantified (alcohol added 1,200 cal this week — 8.5% of total intake; or: zero exercise days, burning 0 cal vs plan of 2,400).

**Ranked improvement suggestions:** Specific and actionable, not generic. "Add a protein shake on rest days (120 cal, 24g protein, closes the gap on 5 of 7 days)" — not "eat more protein."

### Floor-Miss Pattern (required check)

Compute the floor-miss trend across the trailing `[FLOOR_MISS_WINDOW]` logged days (default 7) per [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]]:

- **Protein** missed on a day = below ~90% of the protein floor.
- **Fat** missed on a day = below the fat floor.
- Exclude `sick` days (and, for fat, `fasting` days) — low intake is expected then.

If a floor was missed on `[FLOOR_MISS_COUNT]`+ of those days (default 3), surface it explicitly as a **pattern** (state the count, e.g. "protein under floor 4 of 7 days") in *The Bad* or *The Ugly* and address it in the ranked suggestions. A pattern is a trend, not an isolated incident — don't flag a single miss.

## Saved Report

Write to `Knowledge/Health/Weekly-Diet-Analysis/YYYY-MM-DD.md`:

### Report Structure

```markdown
# Weekly Diet Analysis — Week of [date range]

## Data Table

| Day | Weight | Cal Target | Cal Actual | Delta | Protein | P.Target | Exercise Cal | Notes |
|-----|--------|-----------|-----------|-------|---------|----------|-------------|-------|

## Summary Metrics

- Average daily calories: X (target: Y, delta: Z)
- Average daily protein: Xg (target: Yg)
- Exercise sessions: X/Y planned
- Total exercise calories: X
- Weight change: start → end (delta)
- Floor misses: protein X/7 days, fat X/7 days (flag as a pattern at the configured threshold)

## The Great
## The Good
## The Bad
## The Ugly

## Ranked Suggestions

1. [most impactful change]
2. [second]
3. [third]

## Trends vs Previous Week

- Calorie adherence: [better/worse/same], [numbers]
- Protein adherence: [better/worse/same], [numbers]
- Exercise: [better/worse/same], [numbers]
- Weight trend: [direction and rate]
```

## Rules

- Never fabricate data. Use actual numbers from journals and spreadsheets.
- Compare against the user's own targets (from Overview.md), not generic recommendations.
- Track alcohol separately if the user logs it — total calories and days consumed.
- Don't double-count exercise (exercise calories are separate from food calories).
- Be honest about what's working and what isn't.

## After Writing the Report

Update `Projects/Diet/Overview.md`:
- Running Averages table (if present)
- Weekly Summaries row (if present)
- Any Patterns & Observations notes
