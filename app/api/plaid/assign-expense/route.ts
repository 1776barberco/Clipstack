import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type PlaidTransaction = {
  id: string
  user_id: string
  amount: number
  date: string
  name: string | null
  merchant_name: string | null
  primary_category: string | null
  detailed_category: string | null
  transaction_type: string
  review_status: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { transactionId, bucketId, amount, note } = await request.json()

  if (!transactionId || !bucketId) {
    return NextResponse.json({ error: 'Missing transaction or jar' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const adminSupabase = createSupabaseAdminClient(supabaseUrl, serviceRoleKey)

  const { data: transaction, error: transactionError } = await adminSupabase
    .from('plaid_transactions')
    .select('id,user_id,amount,date,name,merchant_name,primary_category,detailed_category,transaction_type,review_status')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single<PlaidTransaction>()

  if (transactionError || !transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  const isOutgoingTransfer = transaction.primary_category === 'TRANSFER_OUT' && transaction.amount > 0
  if (transaction.transaction_type !== 'expense' && !isOutgoingTransfer) {
    return NextResponse.json({ error: 'Transaction is not an expense' }, { status: 400 })
  }

  if (transaction.review_status === 'assigned') {
    return NextResponse.json({ error: 'Transaction is already assigned' }, { status: 409 })
  }

  const expenseAmount = Number(amount ?? Math.abs(transaction.amount))
  if (!Number.isFinite(expenseAmount) || expenseAmount <= 0 || expenseAmount > Math.abs(transaction.amount) + 0.01) {
    return NextResponse.json({ error: 'Invalid expense amount' }, { status: 400 })
  }

  const description = note ?? `Synced expense: ${transaction.merchant_name ?? transaction.name ?? 'Imported transaction'}`

  const { data: expense, error: expenseError } = await adminSupabase
    .from('expenses')
    .insert({
      user_id: user.id,
      bucket_id: bucketId,
      amount: expenseAmount,
      description,
      category: transaction.primary_category ?? transaction.detailed_category ?? 'Synced',
      entry_date: transaction.date,
    })
    .select('id')
    .single()

  if (expenseError || !expense) {
    console.error('Plaid expense insert failed:', expenseError)
    return NextResponse.json({ error: 'Could not create expense' }, { status: 500 })
  }

  const { error: bucketTransactionError } = await adminSupabase
    .from('bucket_transactions')
    .insert({
      user_id: user.id,
      bucket_id: bucketId,
      amount: -expenseAmount,
      type: 'withdrawal',
      description: `${description}: ${transaction.merchant_name ?? transaction.name ?? 'Imported transaction'}`,
    })

  if (bucketTransactionError) {
    console.error('Plaid bucket withdrawal insert failed:', bucketTransactionError)
    return NextResponse.json({ error: 'Could not update jar balance' }, { status: 500 })
  }

  const { error: allocationError } = await adminSupabase
    .from('plaid_transaction_allocations')
    .insert({
      user_id: user.id,
      plaid_transaction_id: transaction.id,
      bucket_id: bucketId,
      amount: expenseAmount,
      allocation_type: 'expense_withdrawal',
      expense_id: expense.id,
    })

  if (allocationError) {
    console.error('Plaid allocation insert failed:', allocationError)
    return NextResponse.json({ error: 'Could not record transaction assignment' }, { status: 500 })
  }

  const { error: updateError } = await adminSupabase
    .from('plaid_transactions')
    .update({
      transaction_type: 'expense',
      review_status: 'assigned',
      expense_id: expense.id,
      matched_bucket_id: bucketId,
      assignment_note: note ?? null,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', transaction.id)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Plaid transaction update failed:', updateError)
    return NextResponse.json({ error: 'Could not mark transaction assigned' }, { status: 500 })
  }

  return NextResponse.json({ expense_id: expense.id, amount: expenseAmount })
}
