import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { id, type } = await req.json();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (type === 'income') {
      const { data: income } = await supabase
        .from('income_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (income) {
        // @ts-ignore
        const accountId = (income as any).account_id;
        // @ts-ignore
        const amount = (income as any).amount;
        // @ts-ignore
        await supabase.rpc('adjust_account_balance', {
          account_id: accountId,
          amount_change: -amount
        });
        await supabase.from('income_entries').delete().eq('id', id);
      }
    } else {
      const { data: expense } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();

      if (expense) {
        // @ts-ignore
        const accountId = (expense as any).account_id;
        // @ts-ignore
        const amount = (expense as any).amount;
        if (accountId) {
          // @ts-ignore
          await supabase.rpc('adjust_account_balance', {
            account_id: accountId,
            amount_change: amount
          });
        }
        await supabase.from('expenses').delete().eq('id', id);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deletion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
