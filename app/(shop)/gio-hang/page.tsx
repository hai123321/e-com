'use client'

import Link from 'next/link'
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft, Shield, Clock, RotateCcw } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { PromoCodeInput } from '@/components/cart/PromoCodeInput'
import { logoUrl } from '@/lib/api'

export default function GioHangPage() {
  const { items, subtotal, discountAmount, grandTotal, promoCode, updateQty, removeItem, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <main className="section-container py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h1>
        <p className="text-gray-500 mb-8">Hãy khám phá các sản phẩm tuyệt vời của chúng tôi</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tiếp tục mua sắm
        </Link>
      </main>
    )
  }

  return (
    <main className="section-container py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          Giỏ hàng ({items.length} sản phẩm)
        </h1>
        <button
          onClick={clearCart}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, qty }) => (
            <div
              key={product.id}
              className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <Link href={`/san-pham/${product.id}`}>
                <img
                  src={logoUrl(product.image)}
                  alt={product.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover flex-shrink-0 hover:opacity-90 transition-opacity"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/san-pham/${product.id}`}>
                  <h2 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors leading-snug">
                    {product.name}
                  </h2>
                </Link>
                {product.category && (
                  <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                )}
                <p className="text-primary-600 font-bold mt-2">
                  {product.price.toLocaleString('vi-VN')}đ
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(product.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold w-8 text-center">{qty}</span>
                    <button
                      onClick={() => updateQty(product.id, 1)}
                      disabled={qty >= product.stock}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-gray-400">
                      (còn {product.stock})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">
                      {(product.price * qty).toLocaleString('vi-VN')}đ
                    </span>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tiếp tục mua sắm
          </Link>
        </div>

        {/* Order summary sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Tóm tắt đơn hàng</h2>

            <PromoCodeInput />

            <div className="space-y-3 mt-5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {promoCode && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá ({promoCode})</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-medium">Miễn phí</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-lg">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{grandTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <Link
              href="/thanh-toan"
              className="mt-6 w-full block text-center bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              Thanh toán ngay
            </Link>
          </div>

          {/* Trust signals */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <span>Giao ngay sau thanh toán</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <span>Bảo hành 30 ngày</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <RotateCcw className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <span>Hoàn tiền nếu lỗi</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
