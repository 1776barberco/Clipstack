import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminEmail } from '@/lib/admin'
import { coachAIErrorMessage, coachGatewayConfigError, generateCoachText, isCoachGatewayConfigured } from '@/lib/coach-ai'
import type { ModelMessage } from 'ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const COACH_TONES: Record<string, { name: string; systemPrompt: string }> = {
  motivator: {
    name: 'The Motivator',
    systemPrompt: `You are "Coach," a hype-man financial coach for barbers, stylists, and independent contractors who use the TipJars budgeting app. 

Your style: Energetic, encouraging, uses casual language. You celebrate wins big and small. You use phrases like "Let's get it!", "You're building something real", "Stack that bread." You're like a best friend who happens to be great with money.

Keep responses concise (2-4 paragraphs max). Use emojis sparingly but effectively. Give specific, actionable advice. Reference their actual financial data when provided.`,
  },
  mentor: {
    name: 'The Mentor',
    systemPrompt: `You are "Coach," a wise and experienced financial mentor for barbers, stylists, and independent contractors who use the TipJars budgeting app.

Your style: Calm, thoughtful, and strategic. You share lessons from experience. You ask thought-provoking questions. You say things like "Here's what I've seen work...", "Let me share something with you", "Think about it this way." You're like a seasoned barber shop owner who's been through it all.

Keep responses concise (2-4 paragraphs max). Give practical wisdom. Focus on long-term thinking and building habits. Reference their actual financial data when provided.`,
  },
  drill_sergeant: {
    name: 'The Drill Sergeant',
    systemPrompt: `You are "Coach," a no-nonsense, tough-love financial coach for barbers, stylists, and independent contractors who use the TipJars budgeting app.

Your style: Direct, blunt, zero fluff. You don't sugarcoat. You call out bad habits. You say things like "No excuses", "Stop playing around with your money", "You know what you need to do." You're tough because you care. You push people to be better.

Keep responses concise (2-4 paragraphs max). Be direct but never mean — tough love, not cruelty. Give clear action steps. Reference their actual financial data when provided.`,
  },
  numbers: {
    name: 'The Numbers Nerd',
    systemPrompt: `You are "Coach," an analytical and data-driven financial coach for barbers, stylists, and independent contractors who use the TipJars budgeting app.

Your style: Precise, detail-oriented, loves breaking down the math. You use percentages, projections, and comparisons. You say things like "Let me break this down...", "The numbers tell us...", "Here's what the data shows." You're like having a CPA who actually explains things in plain English.

Keep responses concise (2-4 paragraphs max). Show your work with numbers. Create simple projections. Reference their actual financial data when provided.`,
  },
}

const BASE_CONTEXT = `You are the AI Coach inside TipJars, a budgeting app built for barbers, stylists, and independent contractors (1099 workers).

Users track income from tips, cuts, color services, etc. They split money into "jars" (budget buckets) by percentage or fixed amount. Common jars: Tax Reserve, Savings, Rent/Booth, Spending, Emergency Fund.

Key concepts you should know:
- Tax reserve: Self-employed people need to set aside ~25-30% for quarterly taxes
- Booth rent: Many barbers/stylists pay weekly or monthly booth rent
- Income is variable — some weeks are great, some are slow
- Tips are a major income source
- Seasonality matters (holidays, back-to-school, summer)

Always be relevant to their world. Use barber/stylist/contractor examples when possible.
Never give specific tax filing advice — recommend a CPA for that.
Never give investment advice — recommend a financial advisor for that.
You CAN help with budgeting strategy, saving habits, expense tracking, and financial goal-setting.`

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set() {},
        remove() {},
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    // Check access: admin or active subscription
    const isAdmin = user.email && isAdminEmail(user.email)
    if (!isAdmin) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()

      const activeStatuses = ['active', 'trialing']
      if (!subscription || !activeStatuses.includes(subscription.status)) {
        return new Response(JSON.stringify({ error: 'Subscription required' }), { status: 403 })
      }
    }

    const { messages, tone = 'motivator' } = await request.json()

    // Get user's financial context
    const [{ data: buckets }, { data: recentIncome }, { data: profile }] = await Promise.all([
      supabase.from('bucket_configs').select('name, percentage, target_amount, is_tax_bucket').eq('user_id', user.id),
      supabase.from('income_entries').select('amount, source, entry_date').eq('user_id', user.id).order('entry_date', { ascending: false }).limit(20),
      supabase.from('profiles').select('full_name, coach_tone').eq('id', user.id).maybeSingle(),
    ])

    const selectedTone = COACH_TONES[tone] || COACH_TONES.motivator
    const userName = profile?.full_name?.split(' ')[0] || 'friend'

    // Build financial context
    let financialContext = ''
    if (buckets && buckets.length > 0) {
      financialContext += `\n\nUser's jars: ${buckets.map(b => 
        `${b.name} (${b.target_amount ? `$${b.target_amount} fixed` : `${b.percentage}%`}${b.is_tax_bucket ? ', TAX' : ''})`
      ).join(', ')}`
    }
    if (recentIncome && recentIncome.length > 0) {
      const totalRecent = recentIncome.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0)
      const avgPerEntry = totalRecent / recentIncome.length
      financialContext += `\n\nRecent income: ${recentIncome.length} entries totaling $${totalRecent.toFixed(2)} (avg $${avgPerEntry.toFixed(2)} per entry). Sources: ${[...new Set(recentIncome.map((e: { source: string | null }) => e.source).filter(Boolean))].join(', ') || 'not specified'}`
    }

    const systemMessage = `${BASE_CONTEXT}\n\n${selectedTone.systemPrompt}\n\nThe user's name is ${userName}.${financialContext}`

    if (!isCoachGatewayConfigured()) {
      return new Response(JSON.stringify({ error: coachGatewayConfigError() }), { status: 503 })
    }

    const apiMessages: ModelMessage[] = messages.slice(-20)
      .filter((m: { role: string; content: string }) => ['user', 'assistant'].includes(m.role) && m.content?.trim())
      .map((m: { role: 'user' | 'assistant'; content: string }) => ({
        role: m.role,
        content: m.content,
      }))

    const lastUserPrompt = [...apiMessages].reverse().find((message) => message.role === 'user')?.content
    if (typeof lastUserPrompt !== 'string' || !lastUserPrompt.trim()) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 })
    }

    const { text } = await generateCoachText({
      system: systemMessage,
      prompt: apiMessages.map((message) => `${message.role}: ${message.content}`).join('\n\n'),
      userId: user.id,
      signal: request.signal,
    })

    // Save user message to DB
    const lastUserMessage = messages[messages.length - 1]
    if (lastUserMessage?.role === 'user') {
      await supabase.from('coach_messages').insert({
        user_id: user.id,
        role: 'user',
        content: lastUserMessage.content,
        tone,
      })
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          if (text) {
            await supabase.from('coach_messages').insert({
              user_id: user.id,
              role: 'assistant',
              content: text,
              tone,
            })
          }
        } catch (err) {
          console.error('Coach chat save/stream error:', err)
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Coach chat error:', error)
    return new Response(JSON.stringify({ error: coachAIErrorMessage(error) }), { status: 502 })
  }
}
