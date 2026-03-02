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
      console.error('Coach auth error:', authError?.message || 'No user')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Coach: generating for user', user.id, user.email)

    const context = await gatherCoachContext(supabase, user.id)
    console.log('Coach: context gathered, weeklyIncome entries:', context.weeklyIncome.length)

    const prompt = buildCoachPrompt(context)

    console.log('Coach: calling AI API at', COACH_API_URL, 'model:', COACH_MODEL)
    console.log('Coach: API key present:', !!COACH_API_KEY, 'length:', COACH_API_KEY.length)

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

    console.log('Coach: AI response status:', aiResponse.status)

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('Coach AI API error:', aiResponse.status, errorText)
      return NextResponse.json({ error: 'Coach is temporarily unavailable', details: errorText }, { status: 502 })
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      console.error('Coach: no content in AI response', JSON.stringify(aiData).slice(0, 200))
      return NextResponse.json({ error: 'No response from coach' }, { status: 502 })
    }

    let insights
    try {
      const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      insights = JSON.parse(cleaned)
    } catch {
      console.error('Coach: failed to parse AI response:', content.slice(0, 200))
      return NextResponse.json({ error: 'Coach response was invalid' }, { status: 502 })
    }

    const insightsToStore = [
      { type: 'weekly_recap', ...insights.weekly_recap },
      { type: 'jar_recommendation', ...insights.jar_recommendation, data: { suggested_changes: insights.jar_recommendation?.suggested_changes } },
      { type: 'seasonal_forecast', ...insights.seasonal_forecast },
      { type: 'money_tip', ...insights.money_tip },
    ].filter((i: { title?: string; body?: string }) => i.title && i.body)

    for (const insight of insightsToStore) {
      const { error: insertError } = await (supabase as any).from('coaching_insights').insert({
        user_id: user.id,
        insight_type: insight.type,
        title: insight.title,
        body: insight.body,
        data: insight.data || {},
      })
      if (insertError) {
        console.error('Coach: insert error for', insight.type, insertError)
      }
    }

    console.log('Coach: success, stored', insightsToStore.length, 'insights')

    return NextResponse.json({
      insights,
      context: {
        currentWeekIncome: context.currentWeekIncome,
        fourWeekAvgIncome: context.fourWeekAvgIncome,
      },
    })
  } catch (error) {
    console.error('Coach error:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
