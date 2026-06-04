// Example diet-today.js — copy to your vault root as diet-today.js
// This file is rewritten automatically on every food or exercise log.
// The HTML dashboard loads it via <script src="diet-today.js"></script>.
//
// Field names are a strict contract — do not rename properties.
// See Knowledge/Jesse-Guidelines/Fancy-Dashboard-Build.md for the full spec.

window.DIET_TODAY = {
  // Date context
  date: "2026-05-08",
  dayType: "Training day — 7.2km run",  // free-text human label (shown in the header)
  dayStyle: "normal",                   // machine field; key into the Day-Style Registry
                                        // normal | long-run | endurance | refeed | sick |
                                        // carb-load-training | carb-load-race | fasting
  mode: null,                           // legacy banner; null on normal days

  // Targets (numbers from Overview.md, adjusted for the exercise add-back).
  // Bar TYPES (floor/ceiling/window) come from dayStyle, not from here.
  targets: {
    calories: 1942,             // adaptive: 1900 base + 0.50 × (600 × 0.75 haircut) = base + 225
    caloriesCap: null,          // upper bound on window (carb-load) days; null = pure ceiling
    protein: 150,               // protein floor
    fat: 70,                    // fat cap (ceiling component of the fat window)
    fatFloor: 35,               // fat floor (lower bound); null = treat fat as a pure ceiling
    carbs: 180                  // carb floor (remainder)
  },

  // ---------------------------------------------------------------------------
  // Carb-load example (replace the block above on a carb-load day):
  //   dayStyle: "carb-load-race",
  //   targets: { calories: 2400, caloriesCap: 2600,   // calories render as a WINDOW
  //              protein: 150, fat: 50, fatFloor: null, // fat is a minimize-it ceiling
  //              carbs: 450 }                           // high carb floor
  // ---------------------------------------------------------------------------

  // Weight (if logged today; omit or null if no weigh-in)
  weight: null,

  // Meals logged today
  meals: [
    {
      name: "Breakfast",
      time: "07:30",
      items: [
        { item: "Scrambled eggs (2)", amount: "2 large", cal: 180, p: 12, f: 14, c: 1 },
        { item: "Whole wheat toast", amount: "1 slice", cal: 80, p: 4, f: 1, c: 14 },
        { item: "Coffee with whole milk", amount: "1 cup", cal: 30, p: 2, f: 1.5, c: 2 }
      ]
    },
    {
      name: "Lunch",
      time: "12:30",
      items: [
        { item: "Grilled chicken salad", amount: "1 bowl", cal: 420, p: 38, f: 18, c: 22 },
        { item: "Olive oil dressing", amount: "1 tbsp", cal: 120, p: 0, f: 14, c: 0 }
      ]
    }
  ],

  // Exercises logged today
  exercise: [
    {
      type: "Run",
      time: "06:15",
      desc: "Easy 7.2km",
      distance: "7.2",
      unit: " km",
      duration: "38:00",
      pace: "5:16/km",
      avgHR: "148",
      calories: 600
    }
  ]
};
