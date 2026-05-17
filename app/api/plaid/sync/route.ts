import { NextResponse, type NextRequest } from 'next/server'
import { RemovedTransaction, Transaction } from 'plaid'
import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>> & { from: (relation: string) => any }
import { assertPlaidConfigured, plaidClient } from '@/lib/plaid'

export const dynamic = 'force-dynamic'

async function syncItem(supabase: SupabaseClient, userId: string, item: { id: string; access_token: string; transactions_cursor: string | null }) {
  let cursor = item.transactions_cursor ?? undefined
  let hasMore = true
  const added: Transaction[] = []
  const modified: Transaction[] = []
  const removed: RemovedTransaction[] = []

  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: item.access_token,
      cursor,
      count: 500,
    })

    added.push(...response.data.added)
    modified.push(...response.data.modified)
    removed.push(...response.data.removed)
    hasMore = response.data.has_more
    cursor = response.data.next_cursor
  }

  const allTransactions = [...added, ...modified]
  const plaidAccountIds = Array.from(new Set(allTransactions.map((transaction) => transaction.account_id)))

  const { data: accounts, error: accountsError } = await supabase
    .from('plaid_accounts')
    .select('id, plaid_account_id')
    .in('plaid_account_id', plaidAccountIds.length ? plaidAccountIds : ['__none__'])

  if (accountsError) throw accountsError

  const accountIdByPlaidId = new Map((accounts ?? []).map((account: { plaid_account_id: string; id: string }) => [account.plaid_account_id, account.id]))

  if (allTransactions.length) {
    const { error: upsertError } = await supabase
      .from('plaid_transactions')
      .upsert(allTransactions.flatMap((transaction) => {
        const plaidAccountId = accountIdByPlaidId.get(transaction.account_id)
        if (!plaidAccountId) return []

        return [{
          user_id: userId,
          plaid_item_id: item.id,
          plaid_account_id: plaidAccountId,
          plaid_transaction_id: transaction.transaction_id,
          name: transaction.name,
          merchant_name: transaction.merchant_name ?? null,
          amount: transaction.amount,
          iso_currency_code: transaction.iso_currency_code ?? 'USD',
          unofficial_currency_code: transaction.unofficial_currency_code ?? null,
          date: transaction.date,
          authorized_date: transaction.authorized_date ?? null,
          pending: transaction.pending,
          pending_transaction_id: transaction.pending_transaction_id ?? null,
          payment_channel: transaction.payment_channel ?? null,
          category: transaction.category ?? [],
          category_id: transaction.category_id ?? null,
          primary_category: transaction.personal_finance_category?.primary ?? transaction.category?.[0] ?? null,
          detailed_category: transaction.personal_finance_category?.detailed ?? transaction.category?.[1] ?? null,
          transaction_type: transaction.amount < 0 ? 'income' : (transaction.personal_finance_category?.primary === 'TRANSFER_IN' || transaction.personal_finance_category?.primary === 'TRANSFER_OUT' ? 'transfer' : 'expense'),
          personal_finance_category: transaction.personal_finance_category ?? null,
          location: transaction.location ?? null,
          raw: transaction,
        }]
      }), { onConflict: 'plaid_transaction_id' })

    if (upsertError) throw upsertError
  }

  if (removed.length) {
    const { error: deleteError } = await supabase
      .from('plaid_transactions')
      .delete()
      .in('plaid_transaction_id', removed.map((transaction) => transaction.transaction_id))

    if (deleteError) throw deleteError
  }

  const { error: itemError } = await supabase
    .from('plaid_items')
    .update({
      transactions_cursor: cursor ?? null,
      last_synced_at: new Date().toISOString(),
      status: 'active',
      error_code: null,
      error_message: null,
    })
    .eq('id', item.id)

  if (itemError) throw itemError

  return { added: added.length, modified: modified.length, removed: removed.length }
}

export async function POST(request: NextRequest) {
  try {
    assertPlaidConfigured()

    const supabase = await createClient() as SupabaseClient
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    let query = supabase
      .from('plaid_items')
      .select('id, access_token, transactions_cursor')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (body.item_id) query = query.eq('id', body.item_id)

    const { data: items, error: itemsError } = await query
    if (itemsError) throw itemsError

    const results = []
    for (const item of items ?? []) {
      try {
        results.push({ item_id: item.id, ...(await syncItem(supabase, user.id, item)) })
      } catch (syncError) {
        await supabase
          .from('plaid_items')
          .update({ status: 'error', error_message: syncError instanceof Error ? syncError.message : 'Plaid sync failed' })
          .eq('id', item.id)
        throw syncError
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Plaid sync error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to sync transactions' }, { status: 500 })
  }
}
