'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useCart } from '@/hooks/useCart'
import { useT } from '@/lib/hooks/useT'
import { logoUrl } from '@/lib/api'

export function MiniCart() {
  const isMiniCartOpen = useStore((s) => s.isMiniCartOpen)
  const closeMiniCart = useStore((s) => s.closeMiniCart)
  const { items, itemCount, subtotal, discountAmount, grandTotal, promoCode, updateQty, removeItem } = useCart()
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeMiniCart()
      }
    }
    if (isMiniCartOpen) document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isMiniCartOpen, closeMiniCart])

  if (!isMiniCartOpen) return null

  const preview = items.slice(0, 3)
  const remaining = items.length - preview.length

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold text-gray-900">
            {t.miniCart.title(itemCount)}
          </span>
        </div>
        <button onClick={closeMiniCart} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{t.miniCart.empty}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {preview.map(({ product, qty }) => (
            <div key={product.id} className="flex items-center gap-3 px-4 py-3">
              <img
                src={logoUrl(product.image)}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-primary-600 font-semibold mt-0.5">
                  {product.price.toLocaleString()}đ
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQty(product.id, -1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-semibold w-5 text-center">{qty}</span>
                <button
                  onClick={() => updateQty(product.id, 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeItem(product.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <p className="px-4 py-2 text-xs text-gray-400 text-center">{t.miniCart.moreItems(remaining)}</p>
          )}
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t.miniCart.subtotal}</span>
            <span>{subtotal.toLocaleString()}đ</span>
          </div>
          {promoCode && discountAmount > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>{t.miniCart.discount}</span>
              <span>-{discountAmount.toLocaleString()}đ</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
            <span>{t.miniCart.total}</span>
            <span className="text-primary-600">{grandTotal.toLocaleString()}đ</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 flex gap-2">
        <Link
          href="/gio-hang"
          onClick={closeMiniCart}
          className="flex-1 text-center py-2.5 border border-primary-200 text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-50 transition-colors"
        >
          {t.miniCart.viewCart}
        </Link>
        <Link
          href="/thanh-toan"
          onClick={closeMiniCart}
          className="flex-1 text-center py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {t.miniCart.checkout}
        </Link>
      </div>
    </div>
  )
}
