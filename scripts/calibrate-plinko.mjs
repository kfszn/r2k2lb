// One-off generator: calibrated Plinko bucket multipliers.
// Fair ball => bucket j in 0..rows with binomial prob C(rows,j)/2^rows.
// Multiplier shape grows geometrically from center to edges; a single scale is
// solved so realized RTP <= TARGET. Multipliers floored so RTP never exceeds it.

const TARGET = 0.99

function lgamma(z) {
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z)
  z -= 1
  let x = c[0]
  for (let i = 1; i < 9; i++) x += c[i] / (z + i)
  const t = z + 7 + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}
const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1)
const binom = (rows, j) => Math.exp(lchoose(rows, j) - rows * Math.LN2)

// growth per (rows, risk): bigger => spikier edges / lower center.
const GROWTH = {
  8:  { low: 1.42, medium: 2.0,  high: 3.3 },
  12: { low: 1.32, medium: 1.8,  high: 2.85 },
  16: { low: 1.27, medium: 1.65, high: 2.6 },
}

function buildRow(rows, risk) {
  const g = GROWTH[rows][risk]
  const center = rows / 2
  const shape = []
  for (let j = 0; j <= rows; j++) shape.push(Math.pow(g, Math.abs(j - center)))
  let ev = 0
  for (let j = 0; j <= rows; j++) ev += binom(rows, j) * shape[j]
  const scale = TARGET / ev
  const mults = shape.map((s) => {
    const m = scale * s
    return m >= 10 ? Math.floor(m) : Math.floor(m * 100) / 100
  })
  return mults
}

function rtp(rows, mults) {
  let ev = 0
  for (let j = 0; j <= rows; j++) ev += binom(rows, j) * mults[j]
  return ev
}

const out = {}
for (const rows of [8, 12, 16]) {
  out[rows] = {}
  for (const risk of ['low', 'medium', 'high']) {
    out[rows][risk] = buildRow(rows, risk)
  }
}

for (const rows of [8, 12, 16]) {
  console.log(`\n=== ${rows} ROWS ===`)
  for (const risk of ['low', 'medium', 'high']) {
    const m = out[rows][risk]
    console.log(`${risk.padEnd(6)} RTP=${(rtp(rows, m) * 100).toFixed(2)}%  edge=${m[0]} center=${m[rows / 2]}`)
    console.log(`       ${JSON.stringify(m)}`)
  }
}
console.log('\n---JSON---')
console.log(JSON.stringify(out))
