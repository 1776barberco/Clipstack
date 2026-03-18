import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/jars/mark-paid
 *
 * Marks a recurring jar as "paid" — withdraws the full balance and
 * advances the due_date by the configured recurring interval.
 *
 * Body: { bucketId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bucketId } = body

    if (!bucketId || typeof bucketId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid bucketId' },
        { status: 400 }
      )
    }

    // Call the RPC to withdraw balance and advance the due date
    const { data: newDueDate, error: rpcError } = await supabase.rpc(
      'advance_jar_due_date',
      {
        p_bucket_id: bucketId,
        p_user_id: user.id,
      }
    )

    if (rpcError) {
      console.error('[mark-paid] RPC error:', rpcError)
      return NextResponse.json(
        { error: rpcError.message || 'Failed to mark jar as paid' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      newDueDate,
      message: 'Jar marked as paid. Balance withdrawn and due date advanced.',
    })
  } catch (err) {
    console.error('[mark-paid] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
