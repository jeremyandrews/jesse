# Diet Setup Wizard

A guided first-run flow that derives a user's starting calorie and macro targets from first principles, so the diet tracker works for anyone — weight loss, maintenance, recomposition, or athletic training, for any sex — without hand-tuning. This is a **conversational flow the assistant runs** (ask → compute → write the user's targets), not a GUI.

Run it once, when the user first turns on diet tracking or asks to "set up my targets." Afterward it seeds `Projects/Diet/Overview.md` and `diet-today.js` `targets`; the daily flow ([[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]]) takes over.

---

## The estimate is a seed, not a verdict

State this up front so the user does not over-index on the formula: **every number below is provisional.** The body composition input and the sex coefficient only set a *starting* target. After ~2–3 weeks of logging, the calibration loop (bottom of this file) compares the actual weight trend to the prediction and corrects the target to reality. Everyone converges on their true number from data, so the initial inputs are low-stakes.

---

## Wizard Questions (ask in order)

Ask conversationally, a few at a time. Don't dump all nine at once.

1. **Units** — metric or imperial? Store both; compute in metric.
2. **Age.**
3. **Height.**
4. **Current weight**, and **goal weight** (goal weight is optional for maintainers).
5. **Body-fat %, if known** (optional but encouraged — a smart scale, calipers, or DEXA). It unlocks the sex-independent formula; see *Sex / non-binary handling* below.
6. **Sex for the metabolic calculation** — **only asked if body-fat % is unknown.** Frame it as a calculation input, not an identity question (see below).
7. **Activity level** (lifestyle / NEAT, *excluding* logged workouts — those are added per-session via the exercise add-back, so counting them here would double-count):
   - Sedentary `1.2` · Light `1.375` · Moderate `1.55` · Very active `1.725` · Extremely active `1.9`
8. **Goal** — lose / maintain / recomp / gain, plus a target rate (e.g. 0.5–1.0% bodyweight/week for loss).
9. **Training events?** — none / running / cycling / swimming / strength / multisport, plus an optional goal-event date. Enables the endurance / carb-load / taper day-styles and event-aware coach notes ([[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]] Day-Style Registry).

---

## Target Derivation (document the math; everything parameterized)

### BMR — choose the formula by the data available

- **If body-fat % is known → Katch-McArdle** (sex-independent, based on lean mass):

  ```
  LBM_kg = weight_kg × (1 − [BODYFAT_PCT]/100)
  BMR    = 370 + 21.6 × LBM_kg
  ```

- **Else → Mifflin-St Jeor** (needs a sex coefficient `s`):

  ```
  BMR = 10 × weight_kg + 6.25 × [HEIGHT_CM] − 5 × [AGE] + s
        s = +5  ([SEX_FOR_BMR] = male)
        s = −161 ([SEX_FOR_BMR] = female)
  ```

### TDEE and base target

```
TDEE        = BMR × [ACTIVITY_FACTOR]          (lifestyle only — workouts are added per-session)
Base target = TDEE − deficit   (lose)
            = TDEE             (maintain)
            = TDEE + surplus   (gain)
```

Deficit guidance: 0.5–1.0 lb/wk ≈ 250–500 kcal/day. **Cap the loss at ~1% bodyweight/week** to protect lean mass. `Base target` becomes `[BASE_TARGET]` in the calorie formula.

### Macros (the floors and the fat window)

```
Protein floor = [PROTEIN_PER_KG] × weight_kg      (default 1.8–2.2 g/kg; higher on a deficit)
Fat floor     = [FAT_FLOOR_PER_KG] × weight_kg    (default ~0.5 g/kg, with a practical minimum)
Fat cap       = ([FAT_CAL_SHARE] × calories) / 9  (default ≤30% of calories)
Carbs (floor) = remainder: (calories − protein×4 − fat×9) / 4
```

Protein and carbs are floors, fat is a window (floor + cap), calories is a ceiling — see the macro model in [[Knowledge/Jesse-Guidelines/Diet-Logging-Flow]].

### Seed the vault

Write the computed values into `Projects/Diet/Overview.md` (Current Metrics, Target Metrics, Calorie Targets) and into `diet-today.js` `targets` (`calories`, `protein`, `fat`, `fatFloor`, `carbs`).

---

## Sex / Non-Binary Handling

The sex coefficient in Mifflin-St Jeor reflects *average physiological differences in lean mass*, not identity. Handle it accurately **and** inclusively:

1. **Prefer the sex-independent path.** If the user knows their body-fat %, use **Katch-McArdle** — it is based on lean body mass and needs no sex input at all. Offer this first and explain it is both more accurate and identity-neutral.
2. **If sex is needed (no BF%), frame it as a calculation input:** "For the metabolic estimate, which formula coefficient fits your physiology?" — options **Male** / **Female**, plus two escape hatches:
   - **Enter a measured BMR/TDEE directly** (from a lab test or a tracker) — skips the estimate entirely; the most accurate option for anyone.
   - **Non-binary / trans / intersex guidance:** choose the coefficient matching current physiology / hormonal profile (e.g. after sufficient time on HRT, body composition shifts toward the affirmed sex); **or** enter a measured value; **or** use the **average of the two coefficients** (`s = −78`) as a neutral midpoint and let calibration correct it.
3. **It self-corrects.** Whatever method is used, the target is provisional and the calibration loop converges it to reality — so the initial sex/BF input is low-stakes. Say this plainly so no one over-indexes on the formula.

---

## Calibration Loop (the self-correcting step)

After ~2–3 weeks of consistent logging:

1. Take the trend weight change over the window (use the moving-average / regression trend, not a single day — see [[Knowledge/Jesse-Guidelines/Weight-Tracker-Guidelines]]).
2. Convert to an energy balance: **7,700 kcal ≈ 1 kg of fat** (≈3,500 kcal/lb).
   ```
   actual_daily_balance = (trend_kg_change × 7700) / days_in_window
   implied_TDEE         = avg_daily_intake − actual_daily_balance
   ```
3. Set `TDEE` to `implied_TDEE`, recompute the base target and macros, and update `Overview.md`.

Repeat whenever weight stalls for 2+ weeks or after a large bodyweight change. This is what makes the initial BMR method (Katch-McArdle vs. Mifflin, and the sex coefficient) low-stakes — the data wins.

---

## Worked Examples (rotating personas)

**A maintaining cyclist who knows their body-fat % → Katch-McArdle.**
70 kg, 18% body fat, moderately active, maintaining.
`LBM = 70 × (1 − 0.18) = 57.4 kg` → `BMR = 370 + 21.6 × 57.4 ≈ 1,610` → `TDEE = 1,610 × 1.55 ≈ 2,495`.
Maintaining, so base target ≈ 2,495. Protein floor ≈ `2.0 × 70 = 140 g`; fat floor ≈ `0.5 × 70 = 35 g`, fat cap ≈ `0.30 × 2,495 / 9 ≈ 83 g`; carbs = remainder. No sex input was needed.

**A beginner cutter who doesn't know their body-fat % → Mifflin + calibration.**
82 kg, 178 cm, age 35, light activity, female coefficient, losing ~0.6 kg/wk.
`BMR = 10×82 + 6.25×178 − 5×35 − 161 = 820 + 1,112.5 − 175 − 161 = 1,596.5` → `TDEE = 1,596.5 × 1.375 ≈ 2,195`.
Deficit ~500 kcal → base target ≈ 1,695 (within the 1%/wk cap). Protein floor ≈ `2.0 × 82 = 164 g` (high end while cutting); fat floor ≈ `0.5 × 82 = 41 g`. After three weeks the trend shows −0.4 kg/wk instead of −0.6 → calibration lowers the implied TDEE and tightens the target.

These are *examples*; substitute the user's real inputs. No sport, sex, or goal is the default.

---

## Placeholders introduced here

`[SEX_FOR_BMR]` · `[AGE]` · `[HEIGHT_CM]` · `[BODYFAT_PCT]` (optional) · `[ACTIVITY_FACTOR]` · `[GOAL]` · `[GOAL_RATE]` · `[EVENT_TYPE]` · `[EVENT_DATE]` · `[BASE_TARGET]` · `[PROTEIN_PER_KG]` · `[FAT_FLOOR_PER_KG]` · `[FAT_CAL_SHARE]`
