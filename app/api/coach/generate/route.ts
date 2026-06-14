import { NextRequest, NextResponse } from 'next/server'
import { coachGatewayConfigError, generateCoachText, isCoachGatewayConfigured } from '@/lib/coach-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, userId } = body

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user provided' }, { status: 400 })
    }

    if (!isCoachGatewayConfigured()) {
      return NextResponse.json({ error: coachGatewayConfigError() }, { status: 503 })
    }

    const { text, model } = await generateCoachText({
      system: 'You are a financial coach for barbers and stylists. Return only valid JSON.',
      prompt,
      userId,
      signal: request.signal,
    })

    if (!text) {
      return NextResponse.json({ error: 'No response from coach' }, { status: 502 })
    }

    let insights
    try {
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      insights = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Coach response was invalid' }, { status: 502 })
    }

    return NextResponse.json({ insights, model })
  } catch (error) {
    console.error('Coach error:', error)
    return NextResponse.json({ error: 'Coach is temporarily unavailable' }, { status: 502 })
  }
}
