'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sparkles, UserCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { apiUrl } from '@/lib/api'
import type { Product } from '@/lib/types'
import { ProductCard } from '@/components/product/ProductCard'

interface RecommendationItem {
  productId: string | number
  reason: string
}

interface ProductWithReason extends Product {
  reason: string
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse h-72">
      <div className="h-28 sm:h-36 bg-gray-200 rounded-t-xl" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-200 rounded mt-4" />
      </div>
    </div>
  )
}

export function PersonalizedSection() {
  const { user, userToken, sessionHydrated } = useStore()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [triggered, setTriggered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductWithReason[]>([])
  const [failed, setFailed] = useState(false)

  const hasProfile = !!(
    user && (user.age || user.gender || user.occupation)
  )

  useEffect(() => {
    if (triggered || !sessionHydrated || !user || !hasProfile) return
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [triggered, sessionHydrated, user, hasProfile])

  useEffect(() => {
    if (!triggered || !hasProfile || !user || !userToken) return

    setLoading(true)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    Promise.all([
      fetch(apiUrl('/recommendations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ userId: user.id }),
        signal: controller.signal,
      }),
      fetch(apiUrl('/products'), { signal: AbortSignal.timeout(5000) }),
    ])
      .then(async ([recRes, prodRes]) => {
        if (!recRes.ok) {
          setFailed(true)
          return
        }
        const [recJson, prodJson] = await Promise.all([recRes.json(), prodRes.json()])
        const recs: RecommendationItem[] = recJson.recommendations ?? []
        const allProducts: Product[] = prodJson.data ?? prodJson.products ?? []

        const matched = recs
          .map((rec) => {
            const p = allProducts.find((x) => String(x.id) === String(rec.productId))
            return p ? { ...p, reason: rec.reason } : null
          })
          .filter(Boolean) as ProductWithReason[]

        setProducts(matched.slice(0, 6))
      })
      .catch(() => setFailed(true))
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [triggered, hasProfile, user, userToken])

  if (!sessionHydrated || !user) return null
  if (failed) return null

  return (
    <section ref={sectionRef} className="py-12 lg:py-20 bg-gradient-to-b from-purple-50 to-white">
      <div className="section-container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <div className="section-label">
              <Sparkles className="w-4 h-4" />
              Dành riêng cho bạn
            </div>
            <h2 className="section-title">Gợi ý cho bạn</h2>
            <p className="section-sub">Sản phẩm được AI chọn lọc phù hợp với bạn</p>
          </div>
        </div>

        {!hasProfile && (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-purple-100 shadow-sm text-center px-4">
            <UserCircle className="w-12 h-12 text-purple-300 mb-3" />
            <p className="text-gray-700 font-semibold mb-1">Cập nhật hồ sơ để nhận gợi ý phù hợp</p>
            <p className="text-sm text-gray-400 mb-4">Cho chúng tôi biết tuổi, giới tính và nghề nghiệp của bạn</p>
            <Link
              href="/tai-khoan?tab=profile"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl px-5 py-2.5 transition-all hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Cập nhật ngay
            </Link>
          </div>
        )}

        {hasProfile && loading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {hasProfile && !loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
            {products.map((product) => (
              <div key={product.id} className="relative group">
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow pointer-events-none">
                  <Sparkles className="w-2.5 h-2.5" />
                  Dành riêng cho bạn
                </div>

                <ProductCard product={product} />

                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-xl">
                  <p className="font-semibold text-purple-300 mb-0.5">Lý do gợi ý</p>
                  <p className="leading-relaxed">{product.reason}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
