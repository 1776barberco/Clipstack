import { NextRequest, NextResponse } from 'next/server'

const COACH_API_URL = (process.env.COACH_API_URL || 'https://api.kainotomic.com/v1/chat/completions').trim()
const COACH_API_KEY = (process.env.COACH_API_KEY || '').trim()
const COACH_MODEL = (process.env.COACH_MODEL || 'gh/gpt-4o').trim()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })
    }

    if (!COACH_API_KEY) {
      return NextResponse.json({ error: 'Coach API key not configured' }, { status: 500 })
    }

    const aiResponse = await fetch(COACH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COACH_API_KEY}`,
      },
      body: JSON.stringify({
        model: COACH_MODEL,
        messages: [
          { role: 'system', content: 'You are a financial coach for barbers and stylists. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('Coach AI error:', aiResponse.status, errorText)
      return NextResponse.json({ error: 'Coach is temporarily unavailable', status: aiResponse.status, details: errorText.slice(0, 500) }, { status: 502 })
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'No response from coach' }, { status: 502 })
    }

    let insights
    try {
      const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      insights = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Coach response was invalid' }, { status: 502 })
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Coach error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
