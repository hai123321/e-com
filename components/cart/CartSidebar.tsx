'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ShoppingCart, Plus, Minus, CreditCard, Trash2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/hooks/useT'
import { formatCurrency } from '@/lib/utils'
import { getServiceConfig } from '@/lib/service-config'
import { vietQrUrl } from '@/lib/payment'
import { apiUrl } from '@/lib/api'
import type { Product } from '@/lib/types'

type Step = 'cart' | 'form' | 'payment'

interface OrderResult {
  id: number
  total: number
  customerName: string
}

// ── Cart item with image fallback ────────────────────────────────────────────
interface CartItemProps {
  product: Product
  qty: number
  onUpdateQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
}

function CartItem({ product, qty, onUpdateQty, onRemove }: CartItemProps) {
  const [imgError, setImgError] = useState(false)
  const svc = getServiceConfig(product.name, product.category)
  const showImage = product.image && !imgError

  return (
    <div className="flex gap-3 p-3 rounded-2xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-colors group">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-primary-50 shrink-0">
        {showImage ? (
          <Image
            src={product.image!}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            sizes="64px"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${svc.bg} flex items-center justify-center`}>
            <span className="text-2xl">{svc.icon}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
        <p className="text-sm font-bold text-primary-700 mt-0.5">
          {formatCurrency(product.price * qty)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdateQty(product.id, -1)}
            className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-primary-600 hover:border-primary-600 hover:text-white flex items-center justify-center transition-all"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-bold w-6 text-center">{qty}</span>
          <button
            onClick={() => onUpdateQty(product.id, 1)}
            className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-primary-600 hover:border-primary-600 hover:text-white flex items-center justify-center transition-all"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
      <button
        onClick={() => onRemove(product.id)}
        className="self-start text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Cart Sidebar ──────────────────────────────────────────────────────────────
export function CartSidebar() {
  const {
    items, isCartOpen, closeCart,
    updateQty, removeItem, clearCart,
    totalItems, totalPrice, addToast, user,
  } = useStore()
  const t = useT()

  const [step, setStep] = useState<Step>('cart')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState<OrderResult | null>(null)

  const openCheckout = () => {
    if (user) {
      setName((n) => n || user.name)
      setEmail((e) => e || user.email)
    }
    setStep('form')
  }

  const handleClose = () => {
    closeCart()
    setTimeout(() => { setStep('cart'); setOrder(null) }, 350)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(apiUrl('/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || undefined,
          note: note.trim() || undefined,
          items: items.map((i) => ({ productId: Number(i.product.id), quantity: i.qty })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Đặt hàng thất bại')
      setOrder({ id: json.data.id, total: json.data.total, customerName: name.trim() })
      clearCart()
      setStep('payment')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Đặt hàng thất bại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const qrUrl = order ? vietQrUrl(order.total, `order-${String(order.id).padStart(6, '0')}`) : ''

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={handleClose}
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
            {step !== 'cart' && (
              <button onClick={() => setStep('cart')} className="mr-1 hover:opacity-70 transition-opacity">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <ShoppingCart className="w-5 h-5" />
            {step === 'cart' && t.cart.title}
            {step === 'form' && 'Thông tin đặt hàng'}
            {step === 'payment' && 'Thanh toán'}
            {step === 'cart' && totalItems() > 0 && (
              <span className="bg-accent-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {totalItems()}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Cart Step ─────────────────────────────────────────────────── */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                  <ShoppingCart className="w-16 h-16 text-gray-200" />
                  <p className="font-medium">{t.cart.empty}</p>
                  <p className="text-sm text-center">{t.cart.emptyDesc}</p>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    {t.cart.continue}
                  </button>
                </div>
              ) : (
                items.map(({ product, qty }) => (
                  <CartItem
                    key={product.id}
                    product={product}
                    qty={qty}
                    onUpdateQty={updateQty}
                    onRemove={removeItem}
                  />
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="shrink-0 border-t border-gray-100 p-5 bg-gray-50 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{t.cart.qty}</span>
                  <span className="font-semibold text-gray-700">{totalItems()} {t.cart.unit}</span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
                  <span className="font-bold text-gray-900">{t.cart.total}</span>
                  <span className="text-xl font-extrabold text-primary-700">{formatCurrency(totalPrice())}</span>
                </div>
                <button
                  onClick={openCheckout}
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
          </>
        )}

        {/* ── Form Step ─────────────────────────────────────────────────── */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1 p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Họ và tên *</label>
                <input
                  required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại *</label>
                <input
                  required value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567" type="tel"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (nhận tài khoản)</label>
                <input
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" type="email"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                <textarea
                  value={note} onChange={(e) => setNote(e.target.value)}
                  rows={3} placeholder="Yêu cầu đặc biệt..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              {/* Order summary */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5">
                {items.map(({ product, qty }) => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate mr-2">{product.name} ×{qty}</span>
                    <span className="text-gray-900 font-semibold shrink-0">{formatCurrency(product.price * qty)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary-700">{formatCurrency(totalPrice())}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 p-5 border-t border-gray-100">
              <button
                type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                {submitting ? 'Đang đặt...' : 'Xác nhận & Đặt hàng'}
              </button>
            </div>
          </form>
        )}

        {/* ── Payment Step ──────────────────────────────────────────────── */}
        {step === 'payment' && order && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Đặt hàng thành công!</p>
                <p className="text-green-700 text-xs mt-0.5">
                  Mã đơn hàng: <span className="font-bold font-mono">order-{String(order.id).padStart(6, '0')}</span>
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="font-semibold text-gray-800 mb-1">Quét QR để thanh toán</p>
              <p className="text-sm text-gray-500 mb-4">
                Chuyển khoản <span className="font-bold text-primary-700">{formatCurrency(order.total)}</span> với nội dung:
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 inline-block mb-4">
                <code className="font-bold text-primary-800 text-sm tracking-wider">
                  order-{String(order.id).padStart(6, '0')}
                </code>
              </div>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="QR chuyển khoản"
                  width={260}
                  height={300}
                  className="rounded-2xl border border-gray-200 shadow-md"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 space-y-1.5">
              <p>• Đơn hàng sẽ được xử lý sau khi nhận thanh toán</p>
              <p>• Tài khoản giao qua email / Zalo trong 1–2 giờ</p>
              <p>• Hỗ trợ: <a href="https://zalo.me/0383574189" target="_blank" rel="noopener noreferrer" className="text-primary-700 font-semibold">Zalo 038.357.4189</a></p>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
