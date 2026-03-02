import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    model: process.env.COACH_MODEL || 'NOT SET',
    url: process.env.COACH_API_URL || 'NOT SET',
    keyPresent: !!process.env.COACH_API_KEY,
    keyPrefix: (process.env.COACH_API_KEY || '').slice(0, 10),
  })
}
