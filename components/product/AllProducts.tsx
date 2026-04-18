'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, PackageOpen, Loader2, ChevronRight } from 'lucide-react'
import type { CategoryFilter, Product, StockFilter } from '@/lib/types'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/hooks/useT'
import { filterProducts } from '@/lib/utils'
import { apiUrl } from '@/lib/api'
import { ProductCard } from './ProductCard'
import { CategorySidebar } from './CategorySidebar'

const STOCK_VALUES: StockFilter[] = ['all', 'high', 'medium', 'low']

type PriceRange = 'all' | 'lt50' | '50to100' | '100to200' | '200to500' | 'gt500'

const PRICE_PRESETS: { value: PriceRange; label: string }[] = [
  { value: 'all',      label: 'Tất cả' },
  { value: 'lt50',     label: '< 50K' },
  { value: '50to100',  label: '50K – 100K' },
  { value: '100to200', label: '100K – 200K' },
  { value: '200to500', label: '200K – 500K' },
  { value: 'gt500',    label: '> 500K' },
]

function matchesPrice(price: number, range: PriceRange): boolean {
  switch (range) {
    case 'all':      return true
    case 'lt50':     return price < 50_000
    case '50to100':  return price >= 50_000 && price < 100_000
    case '100to200': return price >= 100_000 && price < 200_000
    case '200to500': return price >= 200_000 && price < 500_000
    case 'gt500':    return price >= 500_000
  }
}

const VALID_CATEGORIES: CategoryFilter[] = [
  'all', 'AI', 'Streaming', 'Học tập', 'Thiết kế', 'VPN', 'Năng suất', 'Lưu trữ', 'Khác',
]

function AllProductsInner() {
  const searchParams = useSearchParams()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [priceFilter, setPriceFilter] = useState<PriceRange>('all')
  const t = useT()

  const {
    searchQuery, stockFilter,
    setSearchQuery, setStockFilter, setCategoryFilter, categoryFilter,
  } = useStore()

  // Sync category from URL search param on mount / param change
  useEffect(() => {
    const urlCategory = searchParams.get('category')
    if (urlCategory && VALID_CATEGORIES.includes(urlCategory as CategoryFilter)) {
      setCategoryFilter(urlCategory as CategoryFilter)
    } else if (!urlCategory) {
      setCategoryFilter('all')
    }
  }, [searchParams, setCategoryFilter])

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

  const filtered = filterProducts(allProducts, searchQuery, stockFilter, categoryFilter)

  // De-duplicate by groupKey: keep cheapest representative per group.
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

  const priceFilteredList = useMemo<Product[]>(
    () => representativeList.filter((p) => matchesPrice(p.price, priceFilter)),
    [representativeList, priceFilter],
  )

  return (
    <section className="py-10 bg-primary-50 min-h-screen">
      <div className="section-container">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600">Tất cả sản phẩm</span>
        </nav>

        <div className="flex gap-6">
          <CategorySidebar />

          <div className="flex-1 min-w-0">
            {/* Search + Stock filter bar */}
            <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
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

              {/* Price range row */}
              <div className="w-full flex gap-2 flex-wrap items-center pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Giá:</span>
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setPriceFilter(preset.value)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                      priceFilter === preset.value
                        ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 bg-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                <p className="text-sm">{t.products.loading}</p>
              </div>
            ) : priceFilteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <PackageOpen className="w-14 h-14 text-gray-300" />
                <p className="text-sm">{t.products.empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {priceFilteredList.map((p) => (
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

export function AllProducts() {
  return (
    <Suspense
      fallback={
        <section className="py-10 bg-primary-50 min-h-screen">
          <div className="section-container flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          </div>
        </section>
      }
    >
      <AllProductsInner />
    </Suspense>
  )
}
