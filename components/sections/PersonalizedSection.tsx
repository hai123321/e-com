'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, UserCircle, RefreshCw } from 'lucide-react'
import { useStore } from '@/lib/store'
import { apiUrl } from '@/lib/api'
import type { Product } from '@/lib/types'
import { ProductCard } from '@/components/product/ProductCard'
import { getRuleRecommendations, type RecommendedProduct } from '@/lib/rule-recommendations'

type AnalyzeState = 'idle' | 'loading' | 'done'

export function PersonalizedSection() {
  const { user, sessionHydrated } = useStore()
  const [state, setState]       = useState<AnalyzeState>('idle')
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [error, setError]       = useState(false)

  const hasProfile = !!(user && (user.age || user.gender || user.occupation))

  async function analyze() {
    if (!user || state === 'loading') return
    setState('loading')
    setError(false)

    try {
      const res = await fetch(apiUrl('/products?limit=200'), {
        next: { revalidate: 300 },
      })
      if (!res.ok) throw new Error('fetch failed')

      const json = (await res.json()) as { data?: Product[] }
      const allProducts: Product[] = json.data ?? []

      const recs = getRuleRecommendations(allProducts, {
        age:        user.age,
        gender:     user.gender,
        occupation: user.occupation,
      })

      setProducts(recs)
      setState('done')
    } catch {
      setError(true)
      setState('idle')
    }
  }

  // Don't render until session is ready
  if (!sessionHydrated || !user) return null

  // ── No profile → prompt to fill in info ──────────────────────────────────
  if (!hasProfile) {
    return (
      <section className="py-12 lg:py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="section-container">
          <SectionHeader />
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-purple-100 shadow-sm text-center px-4">
            <UserCircle className="w-12 h-12 text-purple-300 mb-3" />
            <p className="text-gray-700 font-semibold mb-1">Cập nhật hồ sơ để nhận gợi ý phù hợp</p>
            <p className="text-sm text-gray-400 mb-4">
              Cho chúng tôi biết tuổi, giới tính và nghề nghiệp của bạn
            </p>
            <Link
              href="/tai-khoan?tab=profile"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl px-5 py-2.5 transition-all hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Cập nhật ngay
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // ── Has profile → show analyze button + results ───────────────────────────
  return (
    <section className="py-12 lg:py-20 bg-gradient-to-b from-purple-50 to-white">
      <div className="section-container">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 lg:mb-8">
          <SectionHeader />

          <div className="flex items-center gap-2 shrink-0">
            {state === 'done' && (
              <button
                onClick={analyze}
                className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-700 border border-purple-200 hover:border-purple-400 rounded-xl px-3 py-2 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Phân tích lại
              </button>
            )}

            {state !== 'done' && (
              <button
                onClick={analyze}
                disabled={state === 'loading'}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-70 text-white text-sm font-bold rounded-xl px-5 py-2.5 transition-all hover:shadow-lg disabled:cursor-not-allowed"
              >
                {state === 'loading' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Phân tích gợi ý cho tôi
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Profile pill */}
        <ProfileBadge user={user} />

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 mt-3">
            Không thể tải sản phẩm. Vui lòng thử lại.
          </p>
        )}

        {/* Results */}
        {state === 'done' && products.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5 animate-fade-in">
            {products.map((product) => (
              <div key={product.id} className="relative group">
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow pointer-events-none">
                  <Sparkles className="w-2.5 h-2.5" />
                  Dành riêng cho bạn
                </div>

                <ProductCard product={product} />

                {/* Reason tooltip on hover */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-xl">
                  <p className="font-semibold text-purple-300 mb-0.5">Lý do gợi ý</p>
                  <p className="leading-relaxed">{product.reason}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            ))}
          </div>
        )}

        {state === 'done' && products.length === 0 && (
          <p className="mt-6 text-sm text-gray-400 text-center py-8">
            Không tìm thấy gợi ý phù hợp. Hãy thử cập nhật thêm thông tin hồ sơ.
          </p>
        )}
      </div>
    </section>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader() {
  return (
    <div>
      <div className="section-label">
        <Sparkles className="w-4 h-4" />
        Dành riêng cho bạn
      </div>
      <h2 className="section-title">Gợi ý cho bạn</h2>
      <p className="section-sub">Gợi ý sản phẩm dựa trên hồ sơ của bạn</p>
    </div>
  )
}

function ProfileBadge({ user }: { user: { age?: number | null; gender?: string | null; occupation?: string | null } }) {
  const parts: string[] = []
  if (user.age) parts.push(`${user.age} tuổi`)
  if (user.gender === 'Nam') parts.push('Nam')
  else if (user.gender === 'Nu') parts.push('Nữ')
  else if (user.gender === 'Khac') parts.push('Khác')
  if (user.occupation) parts.push(user.occupation)
  if (!parts.length) return null
  return (
    <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium rounded-full px-3 py-1">
      <UserCircle className="w-3.5 h-3.5" />
      {parts.join(' · ')}
    </div>
  )
}
