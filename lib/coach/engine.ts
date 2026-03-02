import { SupabaseClient } from '@supabase/supabase-js'

interface CoachContext {
  userId: string
  weeklyIncome: { week_start: string; total_income: number; entry_count: number }[]
  weeklyExpenses: { week_start: string; total_expenses: number }[]
  buckets: { name: string; percentage: number; target_amount: number | null; color: string }[]
  bucketBalances: { bucket_name: string; current_balance: number }[]
  currentWeekIncome: number
  fourWeekAvgIncome: number
  profile: { full_name: string } | null
}

export async function gatherCoachContext(supabase: SupabaseClient, userId: string): Promise<CoachContext> {
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

  const [incomeRes, expenseRes, bucketsRes, balancesRes, profileRes] = await Promise.all([
    supabase.from('income_entries').select('amount, entry_date').eq('user_id', userId).gte('entry_date', twelveWeeksAgo.toISOString()).order('entry_date', { ascending: false }),
    supabase.from('expenses').select('amount, entry_date, bucket_id').eq('user_id', userId).gte('entry_date', twelveWeeksAgo.toISOString()).order('entry_date', { ascending: false }),
    supabase.from('bucket_configs').select('name, percentage, target_amount, color').eq('user_id', userId),
    supabase.from('bucket_balances').select('bucket_name, current_balance').eq('user_id', userId),
    supabase.from('profiles').select('full_name').eq('id', userId).single(),
  ])

  const weeklyIncome = aggregateByWeek(incomeRes.data || [])
  const weeklyExpenses = aggregateExpensesByWeek(expenseRes.data || [])

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const currentWeekIncome = (incomeRes.data || [])
    .filter(e => new Date(e.entry_date) >= weekStart)
    .reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0)

  const recentWeeks = weeklyIncome.slice(0, 4)
  const fourWeekAvgIncome = recentWeeks.length > 0
    ? recentWeeks.reduce((sum, w) => sum + w.total_income, 0) / recentWeeks.length
    : 0

  return {
    userId,
    weeklyIncome,
    weeklyExpenses,
    buckets: (bucketsRes.data || []) as CoachContext['buckets'],
    bucketBalances: (balancesRes.data || []) as CoachContext['bucketBalances'],
    currentWeekIncome,
    fourWeekAvgIncome,
    profile: profileRes.data as CoachContext['profile'],
  }
}

function aggregateByWeek(entries: { amount: number; entry_date: string }[]) {
  const weeks: Record<string, { total_income: number; entry_count: number }> = {}
  for (const entry of entries) {
    const date = new Date(entry.entry_date)
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const key = weekStart.toISOString().split('T')[0]
    if (!weeks[key]) weeks[key] = { total_income: 0, entry_count: 0 }
    weeks[key].total_income += Number(entry.amount)
    weeks[key].entry_count++
  }
  return Object.entries(weeks)
    .map(([week_start, data]) => ({ week_start, ...data }))
    .sort((a, b) => b.week_start.localeCompare(a.week_start))
}

function aggregateExpensesByWeek(entries: { amount: number; entry_date: string }[]) {
  const weeks: Record<string, { total_expenses: number }> = {}
  for (const entry of entries) {
    const date = new Date(entry.entry_date)
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const key = weekStart.toISOString().split('T')[0]
    if (!weeks[key]) weeks[key] = { total_expenses: 0 }
    weeks[key].total_expenses += Number(entry.amount)
  }
  return Object.entries(weeks)
    .map(([week_start, data]) => ({ week_start, ...data }))
    .sort((a, b) => b.week_start.localeCompare(a.week_start))
}

export function buildCoachPrompt(context: CoachContext): string {
  const name = context.profile?.full_name?.split(' ')[0] || 'there'
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' })

  return `You are TipJars Coach, a personal finance advisor for barbers, stylists, and beauty professionals. Your user's name is ${name}.

PERSONALITY:
- Mix of casual/motivational and straight numbers
- Use emojis sparingly but effectively
- Be encouraging but honest about the numbers
- Keep insights actionable and specific

USER'S CURRENT JAR SETUP:
${context.buckets.map(b =>
  b.target_amount && Number(b.target_amount) > 0
    ? `- ${b.name}: $${b.target_amount} fixed`
    : `- ${b.name}: ${b.percentage}%`
).join('\n')}

JAR BALANCES:
${context.bucketBalances.map(b => `- ${b.bucket_name}: $${Number(b.current_balance).toFixed(2)}`).join('\n')}

INCOME HISTORY (last 12 weeks, most recent first):
${context.weeklyIncome.length > 0
  ? context.weeklyIncome.map(w => `- Week of ${w.week_start}: $${w.total_income.toFixed(2)} (${w.entry_count} entries)`).join('\n')
  : 'No income data yet.'}

EXPENSE HISTORY (last 12 weeks):
${context.weeklyExpenses.length > 0
  ? context.weeklyExpenses.map(w => `- Week of ${w.week_start}: $${w.total_expenses.toFixed(2)}`).join('\n')
  : 'No expense data yet.'}

CURRENT WEEK: $${context.currentWeekIncome.toFixed(2)} earned so far
4-WEEK AVERAGE: $${context.fourWeekAvgIncome.toFixed(2)}/week
CURRENT MONTH: ${currentMonth}

SEASONAL CONTEXT FOR BARBERS/STYLISTS:
- Busy season: August to late December (peak: November-December)
- Slow season: January to late March/early April
- Current month is ${currentMonth}

Generate a weekly coaching insight. Include:
1. A brief weekly recap comparing this week to the 4-week average
2. One specific jar adjustment recommendation if the numbers warrant it
3. A seasonal forecast or preparation tip relevant to the current time of year
4. One actionable money tip based on their actual spending patterns

Format as JSON:
{
  "weekly_recap": {
    "title": "short catchy title",
    "body": "2-3 sentences, mix of motivation and numbers"
  },
  "jar_recommendation": {
    "title": "short title",
    "body": "specific recommendation with numbers",
    "suggested_changes": [{"jar": "name", "current": "20%", "suggested": "25%", "reason": "brief reason"}]
  },
  "seasonal_forecast": {
    "title": "short title",
    "body": "1-2 sentences about what's coming"
  },
  "money_tip": {
    "title": "short title",
    "body": "1-2 actionable sentences"
  }
}

Only return valid JSON. No markdown wrapping.`
}
