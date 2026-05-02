'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CreditCard, CheckCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { apiUrl } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { vietQrUrl, createSepayOrderPayment, pollTransactionStatus } from '@/lib/payment'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
  onClose: () => void
}

type Step = 'form' | 'payment'

interface OrderResult {
  id: number
  total: number
}

export function BuyNowModal({ product, onClose }: Props) {
  const { user, userToken } = useStore()

  const [step, setStep] = useState<Step>('form')
  const [qty, setQty] = useState(1)
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [order, setOrder] = useState<OrderResult | null>(null)
  const [sepayUrl, setSepayUrl] = useState<string | null>(null)
  const [sepayLoading, setSepayLoading] = useState(false)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setPhone(user.phone ?? '')
      setEmail(user.email ?? '')
    }
  }, [user])

  // Attempt Sepay after order is created
  useEffect(() => {
    if (!order) return
    let cancelled = false
    setSepayLoading(true)
    createSepayOrderPayment(order.id, userToken ?? undefined)
      .then(({ paymentUrl, transactionId }) => {
        if (cancelled) return
        setSepayUrl(paymentUrl)
        pollTransactionStatus(String(transactionId), () => setPaid(true), userToken ?? undefined)
      })
      .catch(() => { if (!cancelled) setSepayUrl(null) })
      .finally(() => { if (!cancelled) setSepayLoading(false) })
    return () => { cancelled = true }
  }, [order]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = product.price * qty

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(apiUrl('/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || undefined,
          userId: user?.id ?? undefined,
          items: [{ productId: Number(product.id), quantity: qty }],
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Đặt hàng thất bại')
      setOrder({ id: json.data.id, total: json.data.total ?? total })
      setStep('payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt hàng thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const orderCode = order ? `order-${String(order.id).padStart(6, '0')}` : ''
  const qrUrl = order ? vietQrUrl(order.total, orderCode) : ''

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-extrabold text-gray-900">
            {step === 'form' ? 'Mua ngay' : paid ? 'Thanh toán thành công!' : 'Thanh toán đơn hàng'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product summary */}
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-primary-700 font-bold">{formatCurrency(product.price)}</p>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl border border-gray-300 text-gray-600 font-bold hover:border-primary-400 transition-colors flex items-center justify-center text-lg">
                    –
                  </button>
                  <span className="w-8 text-center font-bold text-gray-800">{qty}</span>
                  <button type="button" onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="w-9 h-9 rounded-xl border border-gray-300 text-gray-600 font-bold hover:border-primary-400 transition-colors flex items-center justify-center text-lg">
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-1">(còn {product.stock})</span>
                </div>
              </div>

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
                  Email <span className="text-gray-400 text-xs font-normal">(nhận tài khoản)</span>
                </label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" type="email"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500">Tổng cộng:</span>
                <span className="text-xl font-extrabold text-primary-700">{formatCurrency(total)}</span>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                  : <><CreditCard className="w-4 h-4" /> Đặt hàng ngay</>}
              </button>
            </form>
          ) : paid ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <p className="font-semibold text-gray-900">Thanh toán thành công!</p>
              <p className="text-sm text-gray-500">Đơn <code className="font-bold">{orderCode}</code> đã xác nhận. Kiểm tra email / Zalo để nhận tài khoản.</p>
              <button onClick={onClose}
                className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                Đóng
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800 text-sm">Đặt hàng thành công!</p>
                  <p className="text-green-700 text-xs">Mã đơn: <span className="font-bold font-mono">{orderCode}</span></p>
                </div>
              </div>

              {(sepayLoading || sepayUrl) && (
                <div className="border border-primary-200 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Thanh toán nhanh qua Sepay</p>
                  {sepayLoading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tạo link...
                    </div>
                  ) : (
                    <a href={sepayUrl!} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                      <CreditCard className="w-4 h-4" /> Thanh toán qua Sepay
                    </a>
                  )}
                </div>
              )}

              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {sepayUrl ? 'Hoặc' : ''} Quét QR chuyển khoản
                </p>
                <p className="text-xs text-gray-500">
                  Nội dung: <code className="font-bold text-primary-800">{orderCode}</code>
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR thanh toán" width={200} height={240}
                  className="mx-auto rounded-xl border border-gray-200 shadow" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
