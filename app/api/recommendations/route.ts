import { NextRequest, NextResponse } from 'next/server'
import { getRecommendations } from '@/lib/ai-recommendations'

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).userId !== 'number' ||
    !Number.isInteger((body as Record<string, unknown>).userId) ||
    (body as Record<string, unknown>).userId as number <= 0
  ) {
    return NextResponse.json({ error: 'userId must be a positive integer' }, { status: 400 })
  }

  const userId = (body as Record<string, unknown>).userId as number
  const recommendations = await getRecommendations(userId)
  return NextResponse.json({ recommendations })
}
