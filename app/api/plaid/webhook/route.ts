import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)

  if (!payload?.item_id) {
    return NextResponse.json({ received: true })
  }

  const supabase = await createClient()

  if (payload.webhook_code === 'ERROR') {
    await supabase
      .from('plaid_items')
      .update({
        status: 'error',
        error_code: payload.error?.error_code ?? null,
        error_message: payload.error?.error_message ?? null,
      })
      .eq('plaid_item_id', payload.item_id)
  }

  if (payload.webhook_code === 'USER_PERMISSION_REVOKED') {
    await supabase
      .from('plaid_items')
      .update({ status: 'revoked' })
      .eq('plaid_item_id', payload.item_id)
  }

  // TRANSACTIONS updates are acknowledged here. Authenticated users can pull the
  // new cursor data via POST /api/plaid/sync; a service-role background worker can
  // call the same sync logic later without adding money-movement capability.
  return NextResponse.json({ received: true })
}
