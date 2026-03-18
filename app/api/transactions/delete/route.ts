import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { id, type } = await req.json();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (type === 'income') {
      const { data: income } = await supabase
        .from('income_entries')
        .select('amount, account_id')
        .eq('id', id)
        .single();

      if (income) {
        await supabase.rpc('adjust_account_balance', {
          account_id: income.account_id,
          amount_change: -income.amount
        });
        await supabase.from('income_entries').delete().eq('id', id);
      }
    } else {
      const { data: expense } = await supabase
        .from('expenses')
        .select('amount, account_id')
        .eq('id', id)
        .single();

      if (expense) {
        await supabase.rpc('adjust_account_balance', {
          account_id: expense.account_id,
          amount_change: expense.amount
        });
        await supabase.from('expenses').delete().eq('id', id);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deletion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
