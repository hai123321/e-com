import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

type UserProfile = {
  name: string
  age?: number | null
  gender?: string | null
  occupation?: string | null
}

type Subscription = {
  serviceName: string
  monthlyPrice: number
}

type Product = {
  id: string
  name: string
  price: number
  category?: string
}

export type Recommendation = {
  productId: string
  reason: string
}

// In-memory cache: userId -> { data, expiresAt }
const cache = new Map<number, { data: Recommendation[]; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function buildPrompt(
  profile: UserProfile,
  subscriptions: Subscription[],
  products: Product[],
): string {
  const profileLine = [
    profile.age ? `${profile.age} tuoi` : null,
    profile.gender === 'male' ? 'nam' : profile.gender === 'female' ? 'nu' : profile.gender ?? null,
    profile.occupation ?? null,
  ]
    .filter(Boolean)
    .join(', ')

  const subsLine =
    subscriptions.length > 0
      ? subscriptions.map((s) => `${s.serviceName} (${s.monthlyPrice.toLocaleString('vi-VN')}d/thang)`).join(', ')
      : 'Chua co'

  const productList = products
    .slice(0, 40) // keep prompt concise
    .map((p) => `[${p.id}] ${p.name} - ${p.price.toLocaleString('vi-VN')}d (${p.category ?? 'Khac'})`)
    .join('\n')

  return (
    `Ban la tro ly ban hang cua MiuShop — chuyen ban phan mem/dich vu subscription.\n` +
    `Khach hang: ${profile.name}${profileLine ? `, ${profileLine}` : ''}.\n` +
    `Dang dung: ${subsLine}.\n` +
    `\nDanh sach san pham MiuShop (id, ten, gia, danh muc):\n${productList}\n` +
    `\nHay goi y TOP 4 san pham phu hop nhat cho khach hang nay.` +
    ` Chi tra loi bang JSON array (khong them chu thich gi khac), dung dang sau:\n` +
    `[{"productId":"<id>","reason":"<ly do ngan gon bang tieng Viet, toi da 15 tu>"}]`
  )
}

function parseRecommendations(raw: string): Recommendation[] {
  // Extract JSON array from the output (Claude may add markdown fences)
  const match = raw.match(/\[\s*\{[\s\S]*?\}\s*\]/)
  if (!match) return []
  try {
    const arr = JSON.parse(match[0])
    if (!Array.isArray(arr)) return []
    return arr
      .filter((item): item is Recommendation => typeof item?.productId === 'string' && typeof item?.reason === 'string')
      .slice(0, 6)
  } catch {
    return []
  }
}

export function getCachedRecommendations(userId: number): Recommendation[] | null {
  const entry = cache.get(userId)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(userId)
    return null
  }
  return entry.data
}

export async function getRecommendations(
  userId: number,
  profile: UserProfile,
  subscriptions: Subscription[],
  products: Product[],
): Promise<Recommendation[]> {
  const cached = getCachedRecommendations(userId)
  if (cached) return cached

  const prompt = buildPrompt(profile, subscriptions, products)

  try {
    const { stdout } = await execAsync(
      `printf '%s' ${JSON.stringify(prompt)} | claude --print`,
      { timeout: 30_000 },
    )
    const recommendations = parseRecommendations(stdout.trim())
    if (recommendations.length > 0) {
      cache.set(userId, { data: recommendations, expiresAt: Date.now() + CACHE_TTL_MS })
    }
    return recommendations
  } catch {
    return []
  }
}
