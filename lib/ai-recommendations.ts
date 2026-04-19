import { spawn } from 'child_process'
import type { Product } from './types'

export interface Recommendation {
  productId: number
  reason: string
}

interface UserProfile {
  id: number
  age?: number | null
  gender?: string | null
  occupation?: string | null
  name?: string | null
}

// In-memory cache keyed by userId, TTL 1 hour
const cache = new Map<number, { data: Recommendation[]; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000

function getCached(userId: number): Recommendation[] | null {
  const entry = cache.get(userId)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(userId)
    return null
  }
  return entry.data
}

function setCached(userId: number, data: Recommendation[]): void {
  cache.set(userId, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

function buildPrompt(user: UserProfile, products: Product[]): string {
  const profileParts: string[] = []
  if (user.age) profileParts.push(`${user.age} tuoi`)
  if (user.gender === 'male') profileParts.push('Nam')
  else if (user.gender === 'female') profileParts.push('Nu')
  else if (user.gender) profileParts.push(user.gender)
  if (user.occupation) profileParts.push(user.occupation)

  const profileStr = profileParts.length > 0 ? profileParts.join(', ') : 'Khong co thong tin'

  const productList = products
    .filter((p) => p.stock > 0)
    .slice(0, 30)
    .map((p) => `ID:${p.id} "${p.name}" ${p.price}d [${p.category ?? 'Other'}]`)
    .join('\n')

  return [
    'Ban la he thong goi y san pham thong minh cho MiuShop - shop ban tai khoan phan mem/dich vu so.',
    '',
    `Thong tin user: ${profileStr}`,
    '',
    'Danh sach san pham hien co:',
    productList,
    '',
    'Nhiem vu: Chon top 4 san pham phu hop nhat voi user dua tren nghe nghiep/do tuoi/gioi tinh.',
    'Tra ve JSON theo dung format sau (khong giai thich them):',
    '{"recommendations":[{"productId":12,"reason":"Ly do ngan gon"},{"productId":5,"reason":"Ly do ngan gon"}]}',
  ].join('\n')
}

function runClaude(prompt: string, timeoutMs = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['--print'], { stdio: ['pipe', 'pipe', 'pipe'] })

    const timer = setTimeout(() => {
      proc.kill()
      reject(new Error('Claude CLI timeout'))
    }, timeoutMs)

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    proc.stdin.write(prompt, 'utf8')
    proc.stdin.end()

    proc.on('close', (code: number | null) => {
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error(`Claude CLI exit ${code}: ${stderr.slice(0, 200)}`))
      } else {
        resolve(stdout.trim())
      }
    })
    proc.on('error', (err: Error) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

function parseRecommendations(output: string): Recommendation[] {
  const jsonMatch = output.match(/\{[\s\S]*"recommendations"[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Claude output')

  const parsed = JSON.parse(jsonMatch[0]) as { recommendations?: unknown[] }
  if (!Array.isArray(parsed.recommendations)) throw new Error('Invalid recommendations format')

  return parsed.recommendations
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      productId: Number(r.productId),
      reason: String(r.reason ?? ''),
    }))
    .filter((r) => !isNaN(r.productId) && r.productId > 0)
}

async function fetchUserProfile(userId: number): Promise<UserProfile> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL
  if (!backendUrl) return { id: userId }

  try {
    const res = await fetch(`${backendUrl}/api/v1/admin/users/${userId}`, {
      headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN ?? '' },
      cache: 'no-store',
    })
    if (!res.ok) return { id: userId }
    const json = (await res.json()) as { data?: UserProfile }
    return json.data ? { ...json.data, id: userId } : { id: userId }
  } catch {
    return { id: userId }
  }
}

async function fetchProducts(): Promise<Product[]> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL
  const url = backendUrl
    ? `${backendUrl}/api/v1/products?limit=100`
    : 'http://localhost:3000/api/products'

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: Product[] }
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
  }
}

function getFeaturedFallback(products: Product[]): Recommendation[] {
  return products
    .filter((p) => p.stock > 0)
    .sort((a, b) => (b.featuredPriority ?? 0) - (a.featuredPriority ?? 0))
    .slice(0, 4)
    .map((p) => ({ productId: Number(p.id), reason: 'San pham noi bat tai MiuShop' }))
}

export async function getRecommendations(userId: number): Promise<Recommendation[]> {
  const cached = getCached(userId)
  if (cached) return cached

  const [user, products] = await Promise.all([
    fetchUserProfile(userId),
    fetchProducts(),
  ])

  if (products.length === 0) return []

  try {
    const prompt = buildPrompt(user, products)
    const output = await runClaude(prompt)
    const recommendations = parseRecommendations(output)
    setCached(userId, recommendations)
    return recommendations
  } catch (err) {
    console.error('[ai-recommendations] Claude CLI error, using fallback:', err)
    const fallback = getFeaturedFallback(products)
    setCached(userId, fallback)
    return fallback
  }
}
