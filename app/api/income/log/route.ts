import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { amount } = await req.json();
  // Allow negative amounts for expenses
  return NextResponse.json({ success: true, amount });
}