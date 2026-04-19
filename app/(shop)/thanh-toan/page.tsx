'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, CreditCard, Loader2, ShoppingBag, User } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { getServiceConfig } from '@/lib/service-config'
import { vietQrUrl } from '@/lib/payment'
import { apiUrl, logoUrl } from '@/lib/api'
import { PromoCodeInput } from '@/components/cart/PromoCodeInput'

interface OrderResult { id: number; total: number }

// ── Shared order summary sidebar ─────────────────────────────────────────────
function OrderSummary() {
  const { items, promoDiscount, promoCode } = useStore()
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0)
  const discount = promoDiscount ?? 0
  const total    = Math.max(0, subtotal - discount)

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4">Đơn hàng ({items.length} sản phẩm)</h2>
        <div className="space-y-3 mb-4">
          {items.map(({ product, qty }) => {
            const svc = getServiceConfig(product.name, product.category)
            return (
              <div key={product.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary-50 shrink-0">
                  {product.image ? (
                    <Image src={logoUrl(product.image)} alt={product.name} width={48} height={48}
                      className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${svc.bg} flex items-center justify-center text-xl`}>
                      {svc.icon}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">×{qty}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">
                  {formatCurrency(product.price * qty)}
                </span>
              </div>
            )
          })}
        </div>

        <PromoCodeInput />

        <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tạm tính</span><span>{formatCurrency(subtotal)}</span>
          </div>
          {promoCode && discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Giảm giá ({promoCode})</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Phí vận chuyển</span>
            <span className="text-green-600 font-medium">Miễn phí</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
            <span>Tổng cộng</span>
            <span className="text-primary-700">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="card p-4 text-sm text-gray-500 space-y-2">
        <p>⚡ Giao ngay sau thanh toán</p>
        <p>🛡️ Bảo hành 30 ngày hoàn tiền</p>
        <p>💬 Hỗ trợ <a href="https://zalo.me/0383574189" target="_blank" rel="noopener noreferrer" className="text-primary-600 font-medium">Zalo 038.357.4189</a></p>
      </div>
    </div>
  )
}

// ── Success / QR screen ───────────────────────────────────────────────────────
function SuccessScreen({ order }: { order: OrderResult }) {
  const qrUrl = vietQrUrl(order.total, `order-${String(order.id).padStart(6, '0')}`)
  return (
    <main className="section-container py-12 max-w-lg mx-auto">
      <div className="card p-8 space-y-6">
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Đặt hàng thành công!</p>
            <p className="text-green-700 text-sm mt-0.5">
              Mã đơn: <span className="font-bold font-mono">order-{String(order.id).padStart(6, '0')}</span>
            </p>
          </div>
        </div>

        <div className="text-center space-y-3">
          <p className="font-semibold text-gray-800">Quét QR để thanh toán</p>
          <p className="text-sm text-gray-500">
            Chuyển khoản <span className="font-bold text-primary-700">{formatCurrency(order.total)}</span> với nội dung:
          </p>
          <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 inline-block">
            <code className="font-bold text-primary-800 tracking-wider">
              order-{String(order.id).padStart(6, '0')}
            </code>
          </div>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR chuyển khoản" width={260} height={300}
              className="rounded-2xl border border-gray-200 shadow-md" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 space-y-1.5">
          <p>• Đơn hàng xử lý sau khi nhận thanh toán</p>
          <p>• Tài khoản giao qua email / Zalo trong 1–2 giờ</p>
          <p>• Hỗ trợ: <a href="https://zalo.me/0383574189" target="_blank" rel="noopener noreferrer" className="text-primary-700 font-semibold">Zalo 038.357.4189</a></p>
        </div>

        <Link href="/" className="block text-center bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl text-sm transition-colors">
          Về trang chủ
        </Link>
      </div>
    </main>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ThanhToanPage() {
  const { items, clearCart, user, promoDiscount, sessionHydrated } = useStore()

  // Form state — used for both logged-in (phone/note only) and guest (full form)
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<OrderResult | null>(null)

  // Pre-fill phone from user profile when available
  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone)
  }, [user?.phone]) // eslint-disable-line react-hooks/exhaustive-deps

  const subtotalAmt = items.reduce((s, i) => s + i.product.price * i.qty, 0)
  const total       = Math.max(0, subtotalAmt - (promoDiscount ?? 0))

  // Wait for hydration to know if user is logged in
  if (!sessionHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0 && !order) {
    return (
      <main className="section-container py-24 flex flex-col items-center gap-6 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-200" />
        <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng trống</h1>
        <p className="text-gray-500">Vui lòng thêm sản phẩm trước khi thanh toán.</p>
        <Link href="/" className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
        </Link>
      </main>
    )
  }

  if (order) return <SuccessScreen order={order} />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      // Logged-in: use user's name + email; guest: use form values
      const customerName  = user ? user.name  : name.trim()
      const customerEmail = user ? user.email : email.trim() || undefined
      const res = await fetch(apiUrl('/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone: phone.trim(),
          customerEmail,
          note: note.trim() || undefined,
          items: items.map(i => ({ productId: Number(i.product.id), quantity: i.qty })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Đặt hàng thất bại')
      clearCart()
      setOrder({ id: json.data.id, total: json.data.total ?? total })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt hàng thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const breadcrumb = (
    <div className="flex items-center gap-2 mb-8 text-sm text-gray-500">
      <Link href="/gio-hang" className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Giỏ hàng
      </Link>
      <span>/</span>
      <span className="text-gray-900 font-semibold">Thanh toán</span>
    </div>
  )

  // ── LOGGED-IN: compact form ──────────────────────────────────────────────
  if (user) {
    return (
      <main className="section-container py-8 md:py-12">
        {breadcrumb}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="card p-6 md:p-8">
              <h1 className="text-xl font-extrabold text-gray-900 mb-6">Xác nhận đặt hàng</h1>

              {/* User info card — readonly */}
              <div className="flex items-center gap-4 p-4 bg-primary-50 border border-primary-200 rounded-2xl mb-6">
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.name} width={48} height={48}
                    className="w-12 h-12 rounded-full object-cover shrink-0" unoptimized />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
                <Link href="/tai-khoan" className="text-xs text-primary-600 hover:underline shrink-0">
                  Sửa
                </Link>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Phone — only field to fill for logged-in users */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số điện thoại *
                  </label>
                  <input
                    required value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="0901234567" type="tel"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    rows={2} placeholder="Yêu cầu đặc biệt..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none" />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                    : <><CreditCard className="w-4 h-4" /> Đặt hàng ngay</>}
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2"><OrderSummary /></div>
        </div>
      </main>
    )
  }

  // ── GUEST: full form ─────────────────────────────────────────────────────
  return (
    <main className="section-container py-8 md:py-12">
      {breadcrumb}

      {/* Login nudge */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-amber-800 flex-1">
          💡 Bạn đã có tài khoản? Đăng nhập để thanh toán nhanh hơn, không cần điền lại thông tin.
        </p>
        <Link href={`/dang-nhap?redirect=/thanh-toan`}
          className="shrink-0 text-sm font-semibold text-amber-900 bg-amber-200 hover:bg-amber-300 px-4 py-2 rounded-xl transition-colors">
          Đăng nhập
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="card p-6 md:p-8">
            <h1 className="text-xl font-extrabold text-gray-900 mb-6">Thông tin đặt hàng</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label>
                <input required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại *</label>
                <input required value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="0901234567" type="tel"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-gray-400 text-xs font-normal">(nhận thông tin tài khoản)</span>
                </label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" type="email"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  rows={3} placeholder="Yêu cầu đặc biệt..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                  : <><CreditCard className="w-4 h-4" /> Xác nhận đặt hàng</>}
              </button>
            </form>
          </div>
        </div>
        <div className="lg:col-span-2"><OrderSummary /></div>
      </div>
    </main>
  )
}
