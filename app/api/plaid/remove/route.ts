import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assertPlaidConfigured, plaidClient } from '@/lib/plaid'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    assertPlaidConfigured()

    const { item_id } = await request.json()
    if (!item_id) {
      return NextResponse.json({ error: 'Missing Plaid item id' }, { status: 400 })
    }

    const supabase = await createClient() as Awaited<ReturnType<typeof createClient>> & { from: (relation: string) => any }
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: item, error: itemError } = await supabase
      .from('plaid_items')
      .select('id, access_token, institution_name')
      .eq('id', item_id)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Connected bank not found' }, { status: 404 })
    }

    await plaidClient.itemRemove({ access_token: item.access_token })

    const { error: deleteError } = await supabase
      .from('plaid_items')
      .delete()
      .eq('id', item.id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true, institution_name: item.institution_name })
  } catch (error) {
    console.error('Plaid disconnect error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect bank' },
      { status: 500 }
    )
  }
}
