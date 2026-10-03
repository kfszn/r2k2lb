import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

export const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

export type AdminRole = 'owner' | 'staff'

export interface AdminSession {
  role: AdminRole
  username: string
  staffId?: string
  exp: number
}

function getSecret() {
  const secret = process.env.BOT_SECRET
  if (!secret) throw new Error('BOT_SECRET is not configured')
  return secret
}

function sign(payload: string) {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export function createSessionToken(session: Omit<AdminSession, 'exp'>) {
  const payload: AdminSession = { ...session, exp: Date.now() + SESSION_TTL_MS }
  const json = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(json)
  return `${json}.${signature}`
}

export function verifySessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null
  const [json, signature] = token.split('.')
  if (!json || !signature) return null
  const expected = sign(json)
  if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null
  }
  try {
    const session = JSON.parse(Buffer.from(json, 'base64url').toString('utf8')) as AdminSession
    if (!session.exp || session.exp < Date.now()) return null
    if (session.role !== 'owner' && session.role !== 'staff') return null
    return session
  } catch {
    return null
  }
}

export function getAdminSession(request: NextRequest): AdminSession | null {
  return verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}

// Password hashing for staff_accounts — scrypt is built into Node, no extra dependency needed.
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return { hash, salt }
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const candidate = scryptSync(password, salt, 64)
  const stored = Buffer.from(hash, 'hex')
  if (candidate.length !== stored.length) return false
  return timingSafeEqual(candidate, stored)
}
