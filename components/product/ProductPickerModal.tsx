'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, ShoppingCart, Package, TrendingUp, Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import { apiUrl } from '@/lib/api'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import { StockBadge } from '@/components/ui/Badge'
import { getServiceConfig } from '@/lib/service-config'
import type { Product } from '@/lib/types'

interface Props {
  groupKey: string
  groupName: string   // name/label shown in header
  onClose: () => void
}

export function ProductPickerModal({ groupKey, groupName, onClose }: Props) {
  const { addItem, items } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [addedId, setAddedId]   = useState<string | null>(null)

  useEffect(() => {
    fetch(apiUrl(`/products/group/${encodeURIComponent(groupKey)}`))
      .then(r => r.json())
      .then(j => setProducts((j.data ?? []) as Product[]))
      .finally(() => setLoading(false))
  }, [groupKey])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleAdd = useCallback((product: Product) => {
    addItem(product)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1200)
  }, [addItem])

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Dim */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Sheet */}
      <div
        className="relative w-full sm:w-[480px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Chọn gói</p>
            <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-1">{groupName}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 ml-3"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Product list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Không có sản phẩm nào</p>
            </div>
          ) : (
            products.map(product => {
              const status  = getStockStatus(product.stock)
              const isOut   = status === 'out'
              const inCart  = items.find(i => i.product.id === product.id)
              const svc   = getServiceConfig(product.name, product.category)
              const added = addedId === product.id

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    isOut
                      ? 'border-gray-100 bg-gray-50 opacity-60'
                      : added
                      ? 'border-green-200 bg-green-50'
                      : inCart
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 cursor-pointer'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${svc.bg} flex items-center justify-center shrink-0 overflow-hidden`}>
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={56}
                        height={56}
                        unoptimized
                        className="object-contain w-full h-full p-1.5 bg-white/10 rounded-xl"
                      />
                    ) : (
                      <span className="text-2xl select-none">{svc.icon}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-extrabold text-primary-700 text-sm">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-[10px] text-gray-400">/ tài khoản</span>
                      {(product.soldCount ?? 0) > 0 && (
                        <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-orange-500 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          {product.soldCount} đã bán
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StockBadge status={status} />
                      {!isOut && (
                        <span className="text-[10px] text-gray-400">Còn {product.stock}</span>
                      )}
                    </div>
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => !isOut && handleAdd(product)}
                    disabled={isOut}
                    className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      added
                        ? 'bg-green-500 text-white'
                        : inCart
                        ? 'bg-primary-100 text-primary-700 hover:bg-primary-600 hover:text-white'
                        : isOut
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md hover:shadow-primary-200'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Đã thêm
                      </>
                    ) : inCart ? (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        +{inCart.qty}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Thêm
                      </>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-3xl sm:rounded-b-2xl">
          <p className="text-xs text-gray-400 text-center">
            Ấn vào sản phẩm để xem chi tiết · Thêm nhiều gói vào giỏ cùng lúc
          </p>
        </div>
      </div>
    </div>
  )
}
