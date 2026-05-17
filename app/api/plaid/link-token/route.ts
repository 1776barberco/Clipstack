import { NextResponse } from 'next/server'
import { CountryCode, Products } from 'plaid'
import { createClient } from '@/lib/supabase/server'
import { assertPlaidConfigured, getPlaidWebhookUrl, plaidClient, plaidCountryCodes, plaidProducts } from '@/lib/plaid'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    assertPlaidConfigured()

    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: 'TipJars',
      products: plaidProducts.length ? plaidProducts : [Products.Transactions],
      country_codes: plaidCountryCodes.length ? plaidCountryCodes : [CountryCode.Us],
      language: 'en',
      webhook: getPlaidWebhookUrl(),
    })

    return NextResponse.json({ link_token: response.data.link_token, expiration: response.data.expiration })
  } catch (error) {
    console.error('Plaid link token error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create link token' }, { status: 500 })
  }
}
