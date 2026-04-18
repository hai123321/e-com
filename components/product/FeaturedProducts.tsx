'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, PackageOpen, Loader2 } from 'lucide-react'
import type { Product } from '@/lib/types'
import { apiUrl } from '@/lib/api'
import { ProductCard } from './ProductCard'
import { CategorySidebar } from './CategorySidebar'

function FeaturedProductsInner() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/products'), { signal: AbortSignal.timeout(5000) })
      .then((r) => r.json())
      .then((json) => {
        const list: Product[] = json.data ?? json.products ?? []
        setAllProducts(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // De-duplicate by groupKey: keep cheapest representative per group.
  // Then sort by featuredPriority desc and take top 8 where priority > 0.
  const featuredList = useMemo<Product[]>(() => {
    const cheapestByGroup = new Map<string, Product>()
    const singletons: Product[] = []

    for (const p of allProducts) {
      const key = p.groupKey
      if (!key) {
        singletons.push(p)
        continue
      }
      const current = cheapestByGroup.get(key)
      if (!current || p.price < current.price) {
        cheapestByGroup.set(key, p)
      }
    }

    const deduped = [...Array.from(cheapestByGroup.values()), ...singletons]

    return deduped
      .filter((p) => (p.featuredPriority ?? 0) > 0)
      .sort((a, b) => (b.featuredPriority ?? 0) - (a.featuredPriority ?? 0))
      .slice(0, 8)
  }, [allProducts])

  return (
    <section id="products" className="py-20 bg-primary-50">
      <div className="section-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="section-label">
              <PackageOpen className="w-4 h-4" />
              Sản phẩm nổi bật
            </div>
            <h2 className="section-title">Sản phẩm nổi bật</h2>
            <p className="section-sub">Danh sách những sản phẩm bán chạy nhất</p>
          </div>
          <Link
            href="/san-pham"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl px-5 py-2.5 transition-all hover:shadow-lg"
          >
            Khám phá tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Body: sidebar + grid */}
        <div className="flex gap-6">
          <CategorySidebar />
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                <p className="text-sm">Đang tải sản phẩm...</p>
              </div>
            ) : featuredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <PackageOpen className="w-14 h-14 text-gray-300" />
                <p className="text-sm">Chưa có sản phẩm nổi bật</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {featuredList.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function FeaturedProducts() {
  return (
    <Suspense
      fallback={
        <section id="products" className="py-20 bg-primary-50">
          <div className="section-container flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          </div>
        </section>
      }
    >
      <FeaturedProductsInner />
    </Suspense>
  )
}
