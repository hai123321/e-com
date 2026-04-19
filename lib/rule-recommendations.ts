/**
 * Rule-based recommendation engine — zero AI calls, instant, client-side.
 *
 * Scores each product against user profile (age, gender, occupation) using
 * category weights and group-key keyword matching, then returns the top N.
 */

import type { Product } from './types'

export interface RecommendedProduct extends Product {
  reason: string
}

interface UserProfile {
  age?: number | null
  gender?: string | null
  occupation?: string | null
}

// ── Category weights by occupation keyword ───────────────────────────────────

const OCCUPATION_RULES: Array<{
  pattern: RegExp
  cats: string[]
  groups: string[]
  reason: string
}> = [
  {
    pattern: /lập trình|developer|software|engineer|kỹ sư|coder|backend|frontend|fullstack|devops/i,
    cats: ['AI', 'Năng suất', 'Lưu trữ'],
    groups: ['chatgpt', 'claude', 'copilot', 'cursor', 'github', 'dropbox', 'notion'],
    reason: 'Hỗ trợ đắc lực cho công việc lập trình',
  },
  {
    pattern: /thiết kế|design|graphic|ux|ui|artist|sáng tạo|creative|illustrator/i,
    cats: ['Thiết kế', 'AI'],
    groups: ['canva', 'figma', 'adobe', 'corel', 'davinci', 'capcut', 'chatgpt'],
    reason: 'Tăng tốc quy trình sáng tạo và thiết kế',
  },
  {
    pattern: /sinh viên|học sinh|student|sinh viên đại học/i,
    cats: ['Học tập', 'AI', 'Năng suất'],
    groups: ['duolingo', 'busuu', 'chegg', 'codecademy', 'coursera', 'datacamp', 'chatgpt', 'claude', 'notion'],
    reason: 'Hỗ trợ học tập và nghiên cứu hiệu quả',
  },
  {
    pattern: /giáo viên|giảng viên|teacher|lecturer|đào tạo|huấn luyện/i,
    cats: ['Học tập', 'Năng suất', 'AI'],
    groups: ['chatgpt', 'claude', 'notion', 'duolingo', 'coursera'],
    reason: 'Hỗ trợ công việc giảng dạy và soạn bài',
  },
  {
    pattern: /kinh doanh|business|marketing|bán hàng|sales|entrepreneur/i,
    cats: ['AI', 'Năng suất', 'Thiết kế'],
    groups: ['chatgpt', 'claude', 'canva', 'copilot', 'notion', 'dropbox'],
    reason: 'Tối ưu hiệu quả kinh doanh và marketing',
  },
  {
    pattern: /youtuber|content creator|streamer|vlogger|video|media/i,
    cats: ['Thiết kế', 'AI', 'Streaming'],
    groups: ['capcut', 'davinci', 'canva', 'chatgpt', 'elevenlabs'],
    reason: 'Công cụ tạo nội dung chuyên nghiệp',
  },
  {
    pattern: /kế toán|accountant|tài chính|finance|ngân hàng|bank/i,
    cats: ['Năng suất', 'AI', 'Lưu trữ'],
    groups: ['chatgpt', 'copilot', 'dropbox', 'notion'],
    reason: 'Hỗ trợ xử lý số liệu và báo cáo tài chính',
  },
  {
    pattern: /bác sĩ|y tế|dược|nurse|healthcare|medical/i,
    cats: ['AI', 'Năng suất'],
    groups: ['chatgpt', 'claude', 'notion', 'dropbox'],
    reason: 'Công cụ hỗ trợ tra cứu và quản lý thông tin y tế',
  },
]

// ── Category weights by age ───────────────────────────────────────────────────

function getAgeCategoryWeights(age: number): Record<string, number> {
  if (age < 22)  return { 'Học tập': 35, 'AI': 25, 'Streaming': 20, 'Năng suất': 10, 'Thiết kế': 10 }
  if (age < 30)  return { 'AI': 35, 'Năng suất': 25, 'Thiết kế': 20, 'Học tập': 10, 'Lưu trữ': 10 }
  if (age < 45)  return { 'AI': 30, 'Năng suất': 30, 'Lưu trữ': 20, 'Thiết kế': 10, 'VPN': 10 }
  return             { 'Năng suất': 35, 'Lưu trữ': 30, 'AI': 20, 'VPN': 15 }
}

// ── Category weights by gender ────────────────────────────────────────────────

const GENDER_CATEGORY_WEIGHTS: Record<string, Record<string, number>> = {
  Nu:   { 'Thiết kế': 20, 'Học tập': 15, 'Streaming': 15, 'AI': 10 },
  Nam:  { 'AI': 20, 'VPN': 15, 'Năng suất': 15 },
  Khac: {},
}

// ── Main scoring function ─────────────────────────────────────────────────────

function scoreProduct(
  product: Product,
  user: UserProfile,
): { score: number; reason: string } {
  let score = 0
  let reason = 'Sản phẩm nổi bật tại MiuShop'

  const cat = product.category ?? ''
  const group = (product.groupKey ?? '').toLowerCase()

  // ① Occupation match (highest weight)
  if (user.occupation) {
    for (const rule of OCCUPATION_RULES) {
      if (rule.pattern.test(user.occupation)) {
        if (rule.cats.includes(cat)) {
          score += 40
          reason = rule.reason
        }
        if (rule.groups.some(g => group.includes(g))) {
          score += 30
          reason = rule.reason
        }
        break
      }
    }
  }

  // ② Age match
  if (user.age) {
    const weights = getAgeCategoryWeights(user.age)
    score += weights[cat] ?? 0
    if (score === 0 && weights[cat]) reason = 'Phù hợp với lứa tuổi của bạn'
  }

  // ③ Gender match
  if (user.gender && GENDER_CATEGORY_WEIGHTS[user.gender]) {
    score += GENDER_CATEGORY_WEIGHTS[user.gender][cat] ?? 0
  }

  // ④ Quality signals
  if (product.stock > 0) score += 5
  if (product.featuredPriority) score += product.featuredPriority * 3
  if (product.soldCount) score += Math.min(product.soldCount / 20, 15)
  if (product.avgRating) score += product.avgRating * 2

  return { score, reason }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns up to `limit` recommended products for the given user profile.
 * Pure function — no side effects, no API calls.
 */
export function getRuleRecommendations(
  products: Product[],
  user: UserProfile,
  limit = 6,
): RecommendedProduct[] {
  if (!products.length) return []

  const inStock = products.filter(p => p.stock > 0)
  if (!inStock.length) return []

  const scored = inStock
    .map(p => ({ product: p, ...scoreProduct(p, user) }))
    .sort((a, b) => b.score - a.score)

  // Take top N unique categories for variety (max 3 per category)
  const catCount: Record<string, number> = {}
  const result: RecommendedProduct[] = []

  for (const { product, reason } of scored) {
    const cat = product.category ?? 'Khác'
    catCount[cat] = (catCount[cat] ?? 0) + 1
    if (catCount[cat] > 3) continue
    result.push({ ...product, reason })
    if (result.length >= limit) break
  }

  // Pad with featured products if we don't have enough
  if (result.length < limit) {
    const usedIds = new Set(result.map(p => p.id))
    const fallback = inStock
      .filter(p => !usedIds.has(p.id))
      .sort((a, b) => (b.featuredPriority ?? 0) - (a.featuredPriority ?? 0))
      .slice(0, limit - result.length)
      .map(p => ({ ...p, reason: 'Sản phẩm nổi bật tại MiuShop' }))
    result.push(...fallback)
  }

  return result
}
