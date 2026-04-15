'use client'

import Image from 'next/image'
import { X, ShoppingCart, Plus, Minus, CreditCard, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/hooks/useT'
import { formatCurrency } from '@/lib/utils'
import { getServiceConfig } from '@/lib/service-config'

export function CartSidebar() {
  const {
    items, isCartOpen, closeCart,
    updateQty, removeItem, clearCart,
    totalItems, totalPrice, addToast,
  } = useStore()
  const t = useT()

  function handleCheckout() {
    addToast(t.cart.checkoutMsg, 'info')
    closeCart()
  }

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeCart}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-800 to-primary-600 text-white shrink-0">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ShoppingCart className="w-5 h-5" />
            {t.cart.title}
            {totalItems() > 0 && (
              <span className="bg-accent-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {totalItems()}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
              <ShoppingCart className="w-16 h-16 text-gray-200" />
              <p className="font-medium">{t.cart.empty}</p>
              <p className="text-sm text-center">{t.cart.emptyDesc}</p>
              <button
                onClick={closeCart}
                className="mt-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                {t.cart.continue}
              </button>
            </div>
          ) : (
            items.map(({ product, qty }) => {
              const svc = getServiceConfig(product.name, product.category)
              return (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 rounded-2xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-primary-50 shrink-0">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        sizes="64px"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${svc.bg} flex items-center justify-center`}>
                        <span className="text-2xl">{svc.icon}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm font-bold text-primary-700 mt-0.5">
                      {formatCurrency(product.price * qty)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(product.id, -1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-primary-600 hover:border-primary-600 hover:text-white flex items-center justify-center transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{qty}</span>
                      <button
                        onClick={() => updateQty(product.id, 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-primary-600 hover:border-primary-600 hover:text-white flex items-center justify-center transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(product.id)}
                    className="self-start text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 p-5 bg-gray-50 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{t.cart.qty}</span>
              <span className="font-semibold text-gray-700">{totalItems()} {t.cart.unit}</span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
              <span className="font-bold text-gray-900">{t.cart.total}</span>
              <span className="text-xl font-extrabold text-primary-700">
                {formatCurrency(totalPrice())}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-200 hover:-translate-y-0.5 text-sm"
            >
              <CreditCard className="w-4 h-4" />
              {t.cart.checkout}
            </button>

            <button
              onClick={clearCart}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
            >
              <Trash2 className="w-3 h-3" />
              {t.cart.clear}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
