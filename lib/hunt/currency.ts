export const CURRENCIES = ['CAD', 'USD', 'NZD'] as const
export type Currency = (typeof CURRENCIES)[number]
export const DEFAULT_CURRENCY: Currency = 'CAD'

const PREFIX: Record<Currency, string> = { CAD: 'C$', USD: '$', NZD: 'NZ$' }

export const CURRENCY_LABEL: Record<Currency, string> = {
  CAD: 'Canadian dollar',
  USD: 'US dollar',
  NZD: 'New Zealand dollar',
}

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value)
}

export function currencyOrDefault(value: unknown): Currency {
  return isCurrency(value) ? value : DEFAULT_CURRENCY
}

export function formatMoney(value: number, currency: Currency = DEFAULT_CURRENCY, options?: { signed?: boolean }) {
  const amount = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const sign = value < 0 ? '-' : options?.signed && value > 0 ? '+' : ''
  return `${sign}${PREFIX[currency]}${amount}`
}

// Stable function identities so animated numbers do not restart on every render.
const FORMATTERS = Object.fromEntries(
  CURRENCIES.map((currency) => [currency, (value: number) => formatMoney(value, currency)])
) as Record<Currency, (value: number) => string>

export const moneyFormatter = (currency: Currency) => FORMATTERS[currency]
