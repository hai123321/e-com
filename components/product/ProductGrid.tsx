'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, PackageOpen, Loader2 } from 'lucide-react'
import type { CategoryFilter, Product, StockFilter } from '@/lib/types'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/hooks/useT'
import { filterProducts } from '@/lib/utils'
import { apiUrl } from '@/lib/api'
import { ProductCard } from './ProductCard'

const CATEGORY_META: { value: CategoryFilter; icon: string }[] = [
  { value: 'all',       icon: '🛍️' },
  { value: 'AI',        icon: '🤖' },
  { value: 'Streaming', icon: '📺' },
  { value: 'Học tập',   icon: '📚' },
  { value: 'Thiết kế',  icon: '🎨' },
  { value: 'VPN',       icon: '🔒' },
  { value: 'Năng suất', icon: '⚡' },
  { value: 'Lưu trữ',  icon: '💾' },
  { value: 'Khác',      icon: '📦' },
]

const STOCK_VALUES: StockFilter[] = ['all', 'high', 'medium', 'low']

export function ProductGrid() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const t = useT()

  const {
    searchQuery, stockFilter, categoryFilter,
    setSearchQuery, setStockFilter, setCategoryFilter,
  } = useStore()

  useEffect(() => {
    fetch(apiUrl('/products'), { signal: AbortSignal.timeout(5000) })
      .then((r) => r.json())
      .then((json) => {
        const list = json.data ?? json.products ?? []
        setAllProducts(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filterProducts(allProducts, searchQuery, stockFilter, categoryFilter)

  // De-duplicate by groupKey: keep cheapest representative per group.
  // Products without groupKey are shown individually.
  const representativeList = useMemo<Product[]>(() => {
    const cheapestByGroup = new Map<string, Product>()
    const singletons: Product[] = []

    for (const p of filtered) {
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

    return [...Array.from(cheapestByGroup.values()), ...singletons]
  }, [filtered])

  return (
    <section id="products" className="py-20 bg-primary-50">
      <div className="section-container">
        {/* Header */}
        <div className="mb-10">
          <div className="section-label">
            <PackageOpen className="w-4 h-4" />
            {t.products.badge}
          </div>
          <h2 className="section-title">{t.products.title}</h2>
          <p className="section-sub">{t.products.sub}</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          {CATEGORY_META.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategoryFilter(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                categoryFilter === tab.value
                  ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 bg-white'
              }`}
            >
              <span>{tab.icon}</span>
              {t.products.categories[tab.value]}
            </button>
          ))}
        </div>

        {/* Search + Stock filter bar */}
        <div className="card p-4 mb-8 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.products.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors"
            />
          </div>

          {/* Stock filter */}
          <div className="flex gap-2 flex-wrap">
            {STOCK_VALUES.map((val) => (
              <button
                key={val}
                onClick={() => setStockFilter(val)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                  stockFilter === val
                    ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                    : 'border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 bg-white'
                }`}
              >
                {t.products.stock[val]}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
            {filtered.length} nhóm / sản phẩm
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            <p className="text-sm">{t.products.loading}</p>
          </div>
        ) : representativeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <PackageOpen className="w-14 h-14 text-gray-300" />
            <p className="text-sm">{t.products.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {representativeList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
