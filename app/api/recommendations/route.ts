import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getRecommendations } from '@/lib/ai-recommendations'
import type { Product } from '@/lib/types'

function parseCSV(csv: string): Product[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  const results: Product[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
      else { current += char }
    }
    values.push(current.trim())
    if (values.length < headers.length) continue
    const row = Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? '']))
    results.push({
      id: String(i), // sequential id
      name: row.name,
      description: row.description,
      price: parseInt(row.price) || 0,
      image: row.image,
      stock: parseInt(row.stock) || 0,
      category: row.category ?? 'Khac',
    })
  }
  return results
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
  } catch {
    return null
  }
}

async function fetchUserSubscriptions(
  token: string,
  apiUrl: string,
): Promise<Array<{ serviceName: string; monthlyPrice: number }>> {
  try {
    const res = await fetch(`${apiUrl}/api/v1/me/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []).map((s: { service_name?: string; serviceName?: string; monthly_price?: number; monthlyPrice?: number }) => ({
      serviceName: s.service_name ?? s.serviceName ?? '',
      monthlyPrice: s.monthly_price ?? s.monthlyPrice ?? 0,
    }))
  } catch {
    return []
  }
}

async function fetchUserProfile(
  token: string,
  apiUrl: string,
): Promise<{ id: number; name: string; age?: number | null; gender?: string | null; occupation?: string | null } | null> {
  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

function getFeaturedFallback(products: Product[]): Array<{ productId: string; reason: string }> {
  return products
    .filter((p) => p.stock > 0)
    .slice(0, 4)
    .map((p) => ({ productId: p.id, reason: 'San pham noi bat cua MiuShop' }))
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = parseJwt(token)
  const userId = typeof payload?.sub === 'number' ? payload.sub
    : typeof payload?.id === 'number' ? payload.id
    : null
  if (!userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Load products from CSV
  let products: Product[] = []
  try {
    const csv = fs.readFileSync(path.join(process.cwd(), 'data', 'products.csv'), 'utf-8')
    products = parseCSV(csv)
  } catch {
    // fallback empty
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

  // Fetch user profile and subscriptions in parallel
  const [profile, subscriptions] = await Promise.all([
    backendUrl ? fetchUserProfile(token, backendUrl) : null,
    backendUrl ? fetchUserSubscriptions(token, backendUrl) : [],
  ])

  // Derive profile from JWT if backend unavailable
  const userProfile = profile ?? {
    id: userId,
    name: (payload?.name as string | undefined) ?? 'Khach hang',
    age: null,
    gender: null,
    occupation: null,
  }

  // If no meaningful profile info, skip Claude and return fallback
  if (!userProfile.age && !userProfile.gender && !userProfile.occupation) {
    return NextResponse.json({ recommendations: getFeaturedFallback(products) })
  }

  const recommendations = await getRecommendations(userId, userProfile, subscriptions ?? [], products)

  if (recommendations.length === 0) {
    return NextResponse.json({ recommendations: getFeaturedFallback(products) })
  }

  return NextResponse.json({ recommendations })
}
