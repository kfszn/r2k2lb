// Case-, punctuation- and spacing-insensitive key, so "Sweet Bonanza", "sweet  bonanza!" and "SWEET-BONANZA" match.
export function normalizeSlotName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function parseMoney(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null
  if (typeof value !== 'string') return null
  const parsed = parseFloat(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function sanitizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2000) return null
  try {
    const url = new URL(trimmed)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}
