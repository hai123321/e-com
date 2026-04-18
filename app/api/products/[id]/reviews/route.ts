import { NextRequest, NextResponse } from 'next/server'

type Review = {
  id: string
  userId: string
  productId: string
  rating: number
  comment: string
  isApproved: boolean
  createdAt: string
  user: { id: string; name: string; avatarUrl?: string }
}

declare global {
  // eslint-disable-next-line no-var
  var __reviews: Review[] | undefined
}

function getStore(): Review[] {
  if (!global.__reviews) global.__reviews = []
  return global.__reviews
}

function buildSummary(reviews: Review[]) {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let total = 0
  for (const r of reviews) {
    const star = Math.round(r.rating)
    if (star >= 1 && star <= 5) dist[star]++
    total++
  }
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0
  return {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: total,
    distribution: dist as { 1: number; 2: number; 3: number; 4: number; 5: number },
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl) {
    const url = new URL(req.url)
    const res = await fetch(`${apiUrl}/products/${params.id}/reviews${url.search}`)
    const json = await res.json().catch(() => ({}))
    return NextResponse.json(json, { status: res.status })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '5')))

  const store = getStore()
  const approved = store.filter(
    (r) => r.productId === params.id && r.isApproved,
  )

  const summary = buildSummary(approved)
  const start = (page - 1) * limit
  const slice = approved
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(start, start + limit)

  return NextResponse.json({
    reviews: slice.map(({ userId: _u, productId: _p, isApproved: _a, ...r }) => r),
    total: approved.length,
    page,
    limit,
    hasMore: start + limit < approved.length,
    summary,
  })
}
