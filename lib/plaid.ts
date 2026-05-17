import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid'

const plaidEnv = process.env.PLAID_ENV ?? 'sandbox'

export const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
        'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
        'Plaid-Version': '2020-09-14',
      },
    },
  })
)

export const plaidProducts = (process.env.PLAID_PRODUCTS ?? 'transactions')
  .split(',')
  .map((product) => product.trim())
  .filter(Boolean) as Products[]

export const plaidCountryCodes = (process.env.PLAID_COUNTRY_CODES ?? 'US')
  .split(',')
  .map((country) => country.trim().toUpperCase())
  .filter(Boolean) as CountryCode[]

export function getPlaidWebhookUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
  if (!baseUrl) return undefined

  const normalized = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
  return `${normalized.replace(/\/$/, '')}/api/plaid/webhook`
}

export function assertPlaidConfigured() {
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    throw new Error('Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET.')
  }
}
