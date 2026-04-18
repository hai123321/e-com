'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Box } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useStore } from '@/lib/store'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import { StockBadge } from '@/components/ui/Badge'
import { RatingSummary } from '@/components/review/RatingSummary'
import { ReviewList } from '@/components/review/ReviewList'
import { ReviewForm } from '@/components/review/ReviewForm'

export default function ProductDetailPage() {
  const { groupKey } = useParams<{ groupKey: string }>()
  const { addItem, items } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewKey, setReviewKey] = useState(0)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const url = apiUrl ? `${apiUrl}/products?groupKey=${groupKey}` : '/api/products'

    fetch(url, { signal: AbortSignal.timeout(5000) })
      .then((r) => r.json())
      .then((json) => {
        const all: Product[] = json.data ?? json.products ?? []
        setProducts(all.filter((p) => p.groupKey === groupKey || p.id === groupKey))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [groupKey])

  const lowestPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : 0
  const totalStock = products.reduce((s, p) => s + p.stock, 0)
  const firstProduct = products[0]

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="h-8 w-40 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </main>
    )
  }

  if (!firstProduct) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-lg mb-4">Không tìm thấy sản phẩm</p>
        <Link href="/" className="text-primary-600 hover:underline text-sm">
          ← Quay về trang chủ
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Tất cả sản phẩm
      </Link>

      {/* Hero */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          {firstProduct.image && (
            <img
              src={firstProduct.image}
              alt={firstProduct.name}
              className="w-20 h-20 object-contain rounded-xl bg-gray-50 p-2 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              {firstProduct.category}
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-1 leading-snug">
              {firstProduct.name.replace(/ \d+ th[aá]ng.*$/i, '').replace(/ \d+ n[aă]m.*$/i, '')}
            </h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed line-clamp-3">
              {firstProduct.description}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-extrabold text-primary-700">
                {products.length > 1 && <span className="text-sm font-normal text-gray-400 mr-1">Từ</span>}
                {formatCurrency(lowestPrice)}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Box className="w-3.5 h-3.5" />
                Còn {totalStock} sản phẩm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variants */}
      {products.length > 1 && (
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Chọn gói</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p) => {
              const status = getStockStatus(p.stock)
              const inCart = items.find((i) => i.product.id === p.id)
              const isOut = status === 'out'
              return (
                <div
                  key={p.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-primary-200 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary-700 font-bold">{formatCurrency(p.price)}</span>
                      <StockBadge status={status} />
                    </div>
                  </div>
                  <button
                    onClick={() => addItem(p)}
                    disabled={isOut}
                    className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white text-xs font-bold rounded-xl px-3 py-2 transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {isOut ? 'Hết' : inCart ? `(${inCart.qty})` : 'Thêm'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Single product add to cart */}
      {products.length === 1 && (() => {
        const p = products[0]
        const status = getStockStatus(p.stock)
        const inCart = items.find((i) => i.product.id === p.id)
        const isOut = status === 'out'
        return (
          <button
            onClick={() => addItem(p)}
            disabled={isOut}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-bold rounded-xl px-6 py-3 transition-all text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            {isOut ? 'Hết hàng' : inCart ? `Đã thêm (${inCart.qty})` : 'Thêm vào giỏ'}
          </button>
        )
      })()}

      {/* Rating summary */}
      <RatingSummary productId={groupKey} refreshKey={reviewKey} />

      {/* Review list */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4">Đánh giá của khách hàng</h2>
        <ReviewList productId={groupKey} refreshKey={reviewKey} />
      </section>

      {/* Review form */}
      <section>
        <ReviewForm productId={groupKey} onSuccess={() => setReviewKey((k) => k + 1)} />
      </section>
    </main>
  )
}
