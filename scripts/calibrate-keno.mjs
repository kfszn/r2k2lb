// One-off generator: calibrated Keno pay tables for a 40-number grid, 10 drawn.
// For each risk profile and pick count k, we choose which hit-counts pay out and
// a geometric "shape", then solve for a single scale so expected return = TARGET.
// Exact hypergeometric probabilities => precise RTP.

const GRID = 40
const DRAWN = 10
const TARGET = 0.99 // 99% RTP

// log-factorial via lgamma for numerical stability
function lgamma(z) {
  const g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z)
  z -= 1
  let x = c[0]
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}
const lchoose = (n, k) => (k < 0 || k > n ? -Infinity : lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1))

// P(match m | picked k) hypergeometric
function hyp(k, m) {
  const num = lchoose(k, m) + lchoose(GRID - k, DRAWN - m)
  const den = lchoose(GRID, DRAWN)
  const lp = num - den
  return lp === -Infinity ? 0 : Math.exp(lp)
}

// Which hit-counts pay, and geometric growth per risk.
// threshold(k) = first m that pays; growth = multiplier ratio between tiers.
const PROFILES = {
  low:    { growth: 1.9, thr: (k) => Math.max(1, Math.ceil(k * 0.5)) },
  medium: { growth: 2.8, thr: (k) => Math.max(1, Math.ceil(k * 0.6)) },
  high:   { growth: 4.2, thr: (k) => Math.max(1, Math.ceil(k * 0.75)) },
}

function buildTable(risk, k) {
  const { growth, thr } = PROFILES[risk]
  let threshold = thr(k)
  if (k === 1) threshold = 1
  // shape weights (relative), geometric from threshold..k
  const shape = {}
  for (let m = threshold; m <= k; m++) shape[m] = Math.pow(growth, m - threshold)
  // expected shape return
  let ev = 0
  for (let m = threshold; m <= k; m++) ev += hyp(k, m) * shape[m]
  const scale = TARGET / ev
  // realized table, rounded to 2 dp (min 0.1 for the lowest tier so it isn't 0)
  const table = {}
  for (let m = threshold; m <= k; m++) {
    let mult = scale * shape[m]
    // Floor so realized RTP never exceeds target (house-favorable).
    mult = mult >= 10 ? Math.floor(mult) : Math.floor(mult * 100) / 100
    table[m] = mult
  }
  return table
}

function realizedRTP(k, table) {
  let ev = 0
  for (const m in table) ev += hyp(k, Number(m)) * table[m]
  return ev
}

const out = { low: {}, medium: {}, high: {} }
for (const risk of Object.keys(PROFILES)) {
  for (let k = 1; k <= 10; k++) {
    out[risk][k] = buildTable(risk, k)
  }
}

// Print report + JSON
for (const risk of Object.keys(out)) {
  console.log(`\n=== ${risk.toUpperCase()} ===`)
  for (let k = 1; k <= 10; k++) {
    const t = out[risk][k]
    console.log(`pick ${k}: RTP=${(realizedRTP(k, t) * 100).toFixed(2)}%  ${JSON.stringify(t)}`)
  }
}
console.log('\n---JSON---')
console.log(JSON.stringify(out))
