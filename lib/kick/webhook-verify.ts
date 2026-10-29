import { createVerify } from 'crypto'

const PUBLIC_KEY_URL = 'https://api.kick.com/public/v1/public-key'
const KEY_TTL_MS = 60 * 60 * 1000
// Kick can rotate the key at any time, but a flood of bad signatures must not trigger a fetch each.
const MIN_REFETCH_MS = 60 * 1000

let cachedKey: { pem: string; fetchedAt: number } | null = null

async function fetchPublicKey(): Promise<string> {
  const res = await fetch(PUBLIC_KEY_URL, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`Kick public key request failed (${res.status})`)

  const text = (await res.text()).trim()
  let pem = text
  try {
    const json = JSON.parse(text)
    pem = json?.data?.public_key ?? json?.public_key ?? text
  } catch {
    // Body is already a raw PEM string
  }

  if (!pem.includes('BEGIN PUBLIC KEY')) {
    throw new Error('Kick public key response was not a PEM public key')
  }

  cachedKey = { pem, fetchedAt: Date.now() }
  return pem
}

function matches(pem: string, payload: string, signature: string) {
  try {
    return createVerify('RSA-SHA256').update(payload).verify(pem, signature, 'base64')
  } catch {
    return false
  }
}

interface VerifyArgs {
  messageId: string | null
  timestamp: string | null
  signature: string | null
  rawBody: string
}

/**
 * Verifies Kick's RSA-SHA256 webhook signature over `${messageId}.${timestamp}.${rawBody}`.
 * Resolves false for an invalid signature; throws only if Kick's public key cannot be fetched.
 */
export async function verifyKickSignature({ messageId, timestamp, signature, rawBody }: VerifyArgs) {
  if (!messageId || !timestamp || !signature) return false

  const payload = `${messageId}.${timestamp}.${rawBody}`
  const cacheIsFresh = cachedKey !== null && Date.now() - cachedKey.fetchedAt < KEY_TTL_MS
  const pem = cacheIsFresh && cachedKey ? cachedKey.pem : await fetchPublicKey()

  if (matches(pem, payload, signature)) return true

  const canRefetch = cachedKey !== null && Date.now() - cachedKey.fetchedAt >= MIN_REFETCH_MS
  if (!canRefetch) return false

  const rotatedPem = await fetchPublicKey()
  return rotatedPem !== pem && matches(rotatedPem, payload, signature)
}
