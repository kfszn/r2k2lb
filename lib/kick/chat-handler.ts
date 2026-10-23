import { createClient } from '@supabase/supabase-js'
import { sendKickChat } from '@/lib/kick/send-chat'

// Points granted per chat message. Adjust here to change the economy.
const CHATTER_POINTS_PER_MESSAGE = 1
const SHOP_POINTS_PER_MESSAGE = 1
// Stops rapid-fire messages from farming points; best effort since serverless instances don't share memory.
const POINTS_COOLDOWN_MS = 30_000

const COMMAND_ALIASES: Record<string, string> = {
  enter: 'entry',
  slot: 'request',
  commands: 'help',
  r2k2: 'help',
}

export interface KickChatPayload {
  message_id?: string
  sender?: { user_id?: number; username?: string; is_anonymous?: boolean }
  content?: string
}

interface ApiResult {
  ok: boolean
  status: number
  data: Record<string, unknown> | null
}

type Api = (path: string, body?: Record<string, unknown>) => Promise<ApiResult>

interface CommandContext {
  username: string
  args: string[]
  rest: string
  api: Api
}

const lastPointsAward = new Map<string, number>()
const customCommandLastUsed = new Map<string, number>()

function resolveBaseUrl(fallbackOrigin: string) {
  const configured = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin
  return configured.replace(/\/+$/, '')
}

function createApi(fallbackOrigin: string): Api {
  const baseUrl = resolveBaseUrl(fallbackOrigin)
  return async (path, body) => {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify({ ...body, botSecret: process.env.BOT_SECRET }) : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })
      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
      return { ok: res.ok, status: res.status, data }
    } catch (error) {
      console.error(`[kick-webhook] ${path} failed:`, error instanceof Error ? error.message : error)
      return { ok: false, status: 0, data: null }
    }
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function mention(username: string, message: string) {
  return message.toLowerCase().includes(`@${username.toLowerCase()}`) ? message : `@${username} ${message}`
}

function parseAmount(raw: string | undefined) {
  if (!raw) return null
  const amount = parseFloat(raw.replace(/[$,x]/gi, ''))
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

function formatAmount(amount: number) {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const HELP_MESSAGE =
  'Sign up at r2k2.gg and link your Kick with !verify <Account ID> (found on r2k2.gg/account) to earn points. ' +
  'Commands: !points | !entry <roobet name> | !request <slot> | !gtb <balance> | !gtm <multi> | !status | !bracket'

const commands: Record<string, (ctx: CommandContext) => Promise<string | null>> = {
  async help({ username }) {
    return mention(username, HELP_MESSAGE)
  },

  async verify({ username, args, api }) {
    const accountId = args[0]
    if (!accountId) return mention(username, 'Usage: !verify <Account ID>. Find your ID at r2k2.gg/account')
    const { data } = await api('/api/kick/verify', { account_id: accountId, kick_username: username })
    return mention(username, text(data?.message) || 'Could not verify your account. Try again later.')
  },

  async points({ username, api }) {
    const { ok, status, data } = await api(`/api/points/balance?kick_username=${encodeURIComponent(username)}`)
    if (status === 404) {
      return mention(username, 'Your Kick account is not linked yet. Sign up at r2k2.gg, then use !verify <Account ID>.')
    }
    if (!ok) return mention(username, 'Could not check your points right now.')
    return mention(username, `You have ${formatAmount(Number(data?.points ?? 0))} points.`)
  },

  async entry({ username, args, api }) {
    const roobetUsername = args[0]
    if (!roobetUsername) return mention(username, 'Usage: !entry <roobet_username>')
    const { data } = await api('/api/bot/join', { kickUsername: username, roobetUsername })
    return mention(username, text(data?.message) || 'Could not enter you right now. Try again.')
  },

  async request({ username, rest, api }) {
    const slotName = rest.slice(0, 100)
    if (!slotName) return mention(username, 'Usage: !request <slot name>')
    const { data } = await api('/api/bot/slot-call', { kickUsername: username, slotName })
    const message = text(data?.message) || 'Could not add your slot call right now.'
    return data?.success ? message : mention(username, message)
  },

  async gtb({ username, args, api }) {
    return submitGuess('gtb', 'Guess The Balance', '!gtb <balance>', { username, args, api })
  },

  async gtm({ username, args, api }) {
    return submitGuess('gtm', 'Guess The Multi', '!gtm <multiplier>', { username, args, api })
  },

  async status({ api }) {
    const { data } = await api('/api/bot/status')
    return text(data?.message) || null
  },

  async bracket({ api }) {
    const { data } = await api('/api/bot/bracket')
    return text(data?.message) || null
  },
}

async function submitGuess(
  type: 'gtb' | 'gtm',
  label: string,
  usage: string,
  { username, args, api }: Pick<CommandContext, 'username' | 'args' | 'api'>
) {
  const guess = parseAmount(args[0])
  if (guess === null) return mention(username, `Usage: ${usage}`)

  const { data } = await api(`/api/bot/predictions/${type}`, { kickUsername: username, guess })
  if (!data?.success) return mention(username, text(data?.message) || `Could not record your ${label} guess.`)

  const prefix = type === 'gtb' ? '$' : ''
  const suffix = type === 'gtm' ? 'x' : ''
  const verb = data.updated ? 'updated' : 'recorded'
  return mention(username, `${label} guess ${verb}: ${prefix}${formatAmount(guess)}${suffix}`)
}

async function runCustomCommand(name: string, username: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('bot_commands')
    .select('response, cooldown_seconds')
    .eq('command', name)
    .eq('is_active', true)
    .maybeSingle()

  // The table may not exist yet; unknown commands should stay silent either way.
  if (error || !data?.response) return null

  const cooldownMs = Math.max(0, Number(data.cooldown_seconds ?? 0)) * 1000
  const lastUsed = customCommandLastUsed.get(name) ?? 0
  if (Date.now() - lastUsed < cooldownMs) return null
  customCommandLastUsed.set(name, Date.now())

  return String(data.response).replaceAll('{user}', username)
}

async function runCommand(content: string, username: string, api: Api) {
  const [rawName, ...args] = content.slice(1).trim().split(/\s+/)
  const name = (rawName ?? '').toLowerCase()
  if (!name) return

  const handler = commands[COMMAND_ALIASES[name] ?? name]
  const reply = handler
    ? await handler({ username, args, rest: args.join(' ').trim(), api })
    : await runCustomCommand(name, username)

  if (reply) await sendKickChat(reply)
}

async function awardPoints(username: string, api: Api) {
  const key = username.toLowerCase()
  const now = Date.now()
  if (now - (lastPointsAward.get(key) ?? 0) < POINTS_COOLDOWN_MS) return
  lastPointsAward.set(key, now)

  if (lastPointsAward.size > 5000) {
    for (const [name, at] of lastPointsAward) {
      if (now - at > POINTS_COOLDOWN_MS) lastPointsAward.delete(name)
    }
  }

  await Promise.allSettled([
    api('/api/bot/chatter-points', { kickUsername: username, points: CHATTER_POINTS_PER_MESSAGE, type: 'message' }),
    // Shop points only apply to linked accounts, and the award route skips everyone else.
    fetch(`${resolveBaseUrl('')}/api/points/award`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kick_username: username,
        points: SHOP_POINTS_PER_MESSAGE,
        type: 'bot_award',
        description: 'Chat message',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    }),
  ])
}

/** Handles a single Kick chat message: giveaway entry, point awards and any chat command. */
export async function processKickChat(payload: KickChatPayload, fallbackOrigin: string) {
  const username = payload.sender?.username
  const content = payload.content?.trim()
  if (!username || !content || payload.sender?.is_anonymous) return

  const botUsername = process.env.KICK_BOT_USERNAME?.toLowerCase()
  if (botUsername && username.toLowerCase() === botUsername) return

  const api = createApi(fallbackOrigin)
  const tasks: Promise<unknown>[] = [
    api('/api/bot/giveaway/enter', { kickUsername: username, message: content }),
    awardPoints(username, api),
  ]
  if (content.startsWith('!')) tasks.push(runCommand(content, username, api))

  const results = await Promise.allSettled(tasks)
  for (const result of results) {
    if (result.status === 'rejected') console.error('[kick-webhook] task failed:', result.reason)
  }
}
