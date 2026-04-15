import { NextResponse } from 'next/server'

export async function GET() {
  // Fallback when NEXT_PUBLIC_API_URL is not configured
  return NextResponse.json({ data: [] })
}
