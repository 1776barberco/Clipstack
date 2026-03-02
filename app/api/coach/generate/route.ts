import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gatherCoachContext, buildCoachPrompt } from '@/lib/coach/engine'

const COACH_API_URL = process.env.COACH_API_URL || 'https://api.kainotomic.com/v1/chat/completions'
const COACH_API_KEY = process.env.COACH_API_KEY || ''
const COACH_MODEL = process.env.COACH_MODEL || 'ag/gemini-3-flash'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const context = await gatherCoachContext(supabase, user.id)
    const prompt = buildCoachPrompt(context)

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
      console.error('AI API error:', errorText)
      return NextResponse.json({ error: 'Coach is temporarily unavailable' }, { status: 502 })
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
      console.error('Failed to parse AI response:', content)
      return NextResponse.json({ error: 'Coach response was invalid' }, { status: 502 })
    }

    const insightsToStore = [
      { type: 'weekly_recap', ...insights.weekly_recap },
      { type: 'jar_recommendation', ...insights.jar_recommendation, data: { suggested_changes: insights.jar_recommendation?.suggested_changes } },
      { type: 'seasonal_forecast', ...insights.seasonal_forecast },
      { type: 'money_tip', ...insights.money_tip },
    ].filter(i => i.title && i.body)

    for (const insight of insightsToStore) {
      await (supabase as any).from('coaching_insights').insert({
        user_id: user.id,
        insight_type: insight.type,
        title: insight.title,
        body: insight.body,
        data: insight.data || {},
      })
    }

    return NextResponse.json({
      insights,
      context: {
        currentWeekIncome: context.currentWeekIncome,
        fourWeekAvgIncome: context.fourWeekAvgIncome,
      },
    })
  } catch (error) {
    console.error('Coach error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
