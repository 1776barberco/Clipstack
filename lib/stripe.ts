import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  console.warn('No Stripe secret key found. Stripe features will be unavailable.')
}

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion })
  : null

export function getPublishableKey(): string {
  return process.env.STRIPE_PUBLISHABLE_KEY_TEST || process.env.STRIPE_PUBLISHABLE_KEY || ''
}

export function isTestMode(): boolean {
  return !!process.env.STRIPE_SECRET_KEY_TEST
}
