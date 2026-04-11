'use client'

import { useEffect, useState } from 'react'
import { Search, PackageOpen, Loader2 } from 'lucide-react'
import type { Product, StockFilter } from '@/lib/types'
import { useStore } from '@/lib/store'
import { filterProducts } from '@/lib/utils'
import { ProductCard } from './ProductCard'

const FILTER_TABS: { value: StockFilter; label: string }[] = [
  { value: 'all',    label: 'Tất cả'   },
  { value: 'high',   label: 'Còn nhiều' },
  { value: 'medium', label: 'Còn ít'    },
  { value: 'low',    label: 'Sắp hết'   },
]

export function ProductGrid() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const { searchQuery, stockFilter, setSearchQuery, setStockFilter } = useStore()

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(({ products }) => { setAllProducts(products); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filterProducts(allProducts, searchQuery, stockFilter)

  return (
    <section id="products" className="py-20 bg-primary-50">
      <div className="section-container">
        {/* Header */}
        <div className="mb-10">
          <div className="section-label">
            <PackageOpen className="w-4 h-4" />
            Sản phẩm
          </div>
          <h2 className="section-title">Dịch vụ streaming cao cấp</h2>
          <p className="section-sub">
            Lựa chọn từ các dịch vụ giải trí hàng đầu thế giới với giá cực ưu đãi.
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="card p-4 mb-8 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStockFilter(tab.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                  stockFilter === tab.value
                    ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                    : 'border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
            {filtered.length} sản phẩm
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            <p className="text-sm">Đang tải sản phẩm...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <PackageOpen className="w-14 h-14 text-gray-300" />
            <p className="text-sm">Không tìm thấy sản phẩm phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
