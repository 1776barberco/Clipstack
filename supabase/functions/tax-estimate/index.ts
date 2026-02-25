// Supabase Edge Function: tax-estimate
// Calculates quarterly tax estimates for users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaxEstimateRequest {
  user_id: string
  year?: number
  quarter?: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, year, quarter } = await req.json() as TaxEstimateRequest

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's tax rate
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('tax_rate')
      .eq('id', user_id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const taxRate = profile?.tax_rate ?? 0.25

    // Calculate quarter dates
    const now = new Date()
    const targetYear = year ?? now.getFullYear()
    const targetQuarter = quarter ?? Math.floor(now.getMonth() / 3) + 1

    const quarterStartMonth = (targetQuarter - 1) * 3
    const quarterStart = new Date(targetYear, quarterStartMonth, 1)
    const quarterEnd = new Date(targetYear, quarterStartMonth + 3, 0)

    // Fetch income for the quarter
    const { data: incomeData, error: incomeError } = await supabaseClient
      .from('income_entries')
      .select('amount, entry_date')
      .eq('user_id', user_id)
      .gte('entry_date', quarterStart.toISOString().split('T')[0])
      .lte('entry_date', quarterEnd.toISOString().split('T')[0])

    if (incomeError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch income data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalIncome = incomeData?.reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0
    const estimatedTax = totalIncome * taxRate

    // Calculate estimated deductions (simplified - 15% of income as business expenses)
    const estimatedDeductions = totalIncome * 0.15
    const taxableIncome = totalIncome - estimatedDeductions
    const estimatedTaxWithDeductions = taxableIncome * taxRate

    const response = {
      year: targetYear,
      quarter: targetQuarter,
      quarter_start: quarterStart.toISOString().split('T')[0],
      quarter_end: quarterEnd.toISOString().split('T')[0],
      total_income: totalIncome,
      estimated_deductions: estimatedDeductions,
      taxable_income: taxableIncome,
      tax_rate: taxRate,
      estimated_tax: estimatedTax,
      estimated_tax_with_deductions: estimatedTaxWithDeductions,
      entries_count: incomeData?.length ?? 0,
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
