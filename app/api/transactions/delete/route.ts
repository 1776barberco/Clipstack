import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { id, type } = await req.json();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (type === 'income') {
    // 1. Get transaction details to adjust bank balance
    const { data: income } = await supabase
      .from('income_entries')
      .select('amount, account_id')
      .eq('id', id)
      .single();

    if (income) {
      // 2. Adjust bank balance
      await supabase.rpc('adjust_account_balance', {
        account_id: income.account_id,
        amount_change: -income.amount
      });

      // 3. Delete income entry (cascades to bucket_transactions)
      await supabase.from('income_entries').delete().eq('id', id);
    }
  } else {
    // Deleting an expense
    const { data: expense } = await supabase
      .from('expenses')
      .select('amount, account_id')
      .eq('id', id)
      .single();

    if (expense) {
      // 1. Refund the bank account
      await supabase.rpc('adjust_account_balance', {
        account_id: expense.account_id,
        amount_change: expense.amount
      });

      // 2. Delete the expense
      await supabase.from('expenses').delete().eq('id', id);
    }
  }

  return NextResponse.json({ success: true });
}