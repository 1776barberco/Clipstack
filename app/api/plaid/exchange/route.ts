import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assertPlaidConfigured, plaidClient } from '@/lib/plaid'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    assertPlaidConfigured()

    const { public_token } = await request.json()
    if (!public_token) {
      return NextResponse.json({ error: 'public_token is required' }, { status: 400 })
    }

    const supabase = await createClient() as any
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = tokenResponse.data
    const itemResponse = await plaidClient.itemGet({ access_token })
    const item = itemResponse.data.item

    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .upsert({
        user_id: user.id,
        plaid_item_id: item_id,
        access_token,
        institution_id: item.institution_id ?? null,
        institution_name: item.institution_name ?? null,
        products: item.products ?? ['transactions'],
        available_products: item.available_products ?? [],
        billed_products: item.billed_products ?? [],
        status: 'active',
        error_code: null,
        error_message: null,
      }, { onConflict: 'plaid_item_id' })
      .select('id')
      .single()

    if (itemError || !plaidItem) throw itemError

    const accountsResponse = await plaidClient.accountsGet({ access_token })
    const accounts = accountsResponse.data.accounts

    if (accounts.length) {
      const { error: accountsError } = await supabase
        .from('plaid_accounts')
        .upsert(accounts.map((account) => ({
          user_id: user.id,
          plaid_item_id: plaidItem.id,
          plaid_account_id: account.account_id,
          name: account.name,
          official_name: account.official_name ?? null,
          mask: account.mask ?? null,
          type: account.type,
          subtype: account.subtype ?? null,
          verification_status: account.verification_status ?? null,
          current_balance: account.balances.current ?? null,
          available_balance: account.balances.available ?? null,
          iso_currency_code: account.balances.iso_currency_code ?? 'USD',
          unofficial_currency_code: account.balances.unofficial_currency_code ?? null,
          is_active: true,
        })), { onConflict: 'plaid_account_id' })

      if (accountsError) throw accountsError
    }

    return NextResponse.json({ success: true, item_id: plaidItem.id, accounts: accounts.length })
  } catch (error) {
    console.error('Plaid exchange error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to connect Plaid item' }, { status: 500 })
  }
}
