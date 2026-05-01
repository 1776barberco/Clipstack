import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { id, type, scope } = await req.json()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (scope === 'all') {
      const { error } = await supabase.rpc('clear_user_transaction_history' as never, {
        p_user_id: user.id,
      } as never)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (!id || (type !== 'income' && type !== 'expense')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const rpcName = type === 'income' ? 'delete_income_entry' : 'delete_expense_entry'
    const rpcArgs = type === 'income'
      ? { p_income_entry_id: id, p_user_id: user.id }
      : { p_expense_id: id, p_user_id: user.id }

    const { error } = await supabase.rpc(rpcName as never, rpcArgs as never)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deletion error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
