/******************************************************
 * JEE Percentile Predictor
 * Right-skewed, difficulty-adaptive
 * Only input needed per shift: M99
 * f depends on M99
 * Supports 0 → 99.99 percentile
 ******************************************************/

/* ====================================================
   1) BASE PERCENTILE SHAPE (REFERENCE)
   Updated f-values to reflect the real distribution density 
   seen in mid-range shifts (e.g., 30S1).
==================================================== */

const baseCurve = [
  { p: 99.99, f: 1.45 }, 
  { p: 99.9,  f: 1.33 }, // Adjusted to match ~257/193
  { p: 99.8,  f: 1.25 },
  { p: 99.7,  f: 1.20 },
  { p: 99.6,  f: 1.15 },
  { p: 99.5,  f: 1.12 },
  { p: 99.4,  f: 1.09 },
  { p: 99.3,  f: 1.06 },
  { p: 99.2,  f: 1.04 },
  { p: 99.1,  f: 1.02 },
  { p: 99.0,  f: 1.00 },  // 🔒 HARD ANCHOR

  { p: 98.5, f: 0.927 },
  { p: 98.0, f: 0.876 },
  { p: 97.5, f: 0.824 },
  { p: 97.0, f: 0.788 },
  { p: 96.5, f: 0.756 },
  { p: 96.0, f: 0.725 },
  { p: 95.5, f: 0.699 },
  { p: 95.0, f: 0.674 },
  { p: 94.0, f: 0.637 },
  { p: 93.0, f: 0.596 },
  { p: 92.0, f: 0.560 },
  { p: 91.0, f: 0.534 },
  { p: 90.0, f: 0.508 },

  { p: 80.0, f: 0.400 },
  { p: 70.0, f: 0.320 },
  { p: 60.0, f: 0.260 },
  { p: 50.0, f: 0.210 },
  { p: 40.0, f: 0.170 },
  { p: 30.0, f: 0.140 },
  { p: 20.0, f: 0.110 },
  { p: 10.0, f: 0.080 },
  { p: 0.0,  f: 0.040 }
];

/* ====================================================
   2) SHIFT DATA — YOU ONLY EDIT THIS
==================================================== */

const shiftM99 = {
  "21S1": 236,
  "21S2": 211,
  "22S1": 203,
  "22S2": 212,
  "23S1": 193,
  "23S2": 191,
  "24S1": 170,
  "24S2": 151,
  "28S1": 161,
  "28S2": 172
};

/* ====================================================
   3) DIFFICULTY-SENSITIVE f(M99)
   Guarantees f(99) = 1 exactly
==================================================== */

function difficultyFactor(M99) {
  // Normalize difficulty: 0 = hardest (151), 1 = easiest (236)
  const t = Math.min(Math.max((M99 - 151) / (236 - 151), 0), 1);
  return t;
}

function adjustedF(pt, M99) {
  const t = difficultyFactor(M99);

  // 🔒 Hard anchor: never touch f at p = 99
  if (pt.p === 99.0) return 1.0;

  // TOP TAIL: Higher M99 (easy) -> lower inflation. Lower M99 (hard) -> higher inflation.
  // This matches the data where 31S2 (Hard) needs a 1.42x multiplier for 99.9.
  if (pt.p > 99.0) {
    const inflation = 1.08 - 0.20 * t;  
    return pt.f * inflation;
  }

  // MID + LOWER: Light compression logic
  const compression = 0.96 + 0.04 * t;  
  return pt.f * compression;
}

/* ====================================================
   4) GENERATE FULL CURVE FROM M99
==================================================== */

function generateCurve(M99) {
  return baseCurve.map(pt => ({
    p: pt.p,
    m: adjustedF(pt, M99) * M99
  }));
}

/* ====================================================
   5) INTERPOLATION (MARKS → PERCENTILE)
==================================================== */

function predictFromCurve(curve, marks) {
  if (marks >= curve[0].m) return curve[0].p;
  if (marks <= curve[curve.length - 1].m)
    return curve[curve.length - 1].p;

  for (let i = 0; i < curve.length - 1; i++) {
    const p1 = curve[i].p;
    const m1 = curve[i].m;
    const p2 = curve[i + 1].p;
    const m2 = curve[i + 1].m;

    if (marks <= m1 && marks >= m2) {
      return (
        p1 +
        (marks - m1) * (p2 - p1) / (m2 - m1)
      );
    }
  }

  return null;
}

/* ====================================================
   6) MAIN PREDICT FUNCTION
==================================================== */

function predict() {
  const shift = document.getElementById("shift").value;
  const marks = parseFloat(document.getElementById("marks").value);
  const resultDiv = document.getElementById("result");

  if (!shift || isNaN(marks) || marks < 0 || marks > 300) {
    resultDiv.innerHTML = "❌ Enter valid shift and marks.";
    return;
  }

  const M99 = shiftM99[shift];
  if (!M99) {
    resultDiv.innerHTML = "❌ No data for this shift.";
    return;
  }

  const curve = generateCurve(M99);
  let percentile = predictFromCurve(curve, marks);

  // Hard clamps
  if (percentile > 99.99) percentile = 99.99;
  if (percentile < 0) percentile = 0;

  resultDiv.innerHTML = `
    🎯 Predicted Percentile:<br>
    <span style="color:#4facfe">${percentile.toFixed(3)}</span>
  `;
}