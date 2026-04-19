'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Store, Search, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

interface OrderItem {
  id: number
  productName: string
  productPrice: number
  quantity: number
}

interface Order {
  id: number
  customerName: string
  customerPhone: string
  customerEmail: string | null
  status: string
  total: number
  note: string | null
  createdAt: string
  items: OrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:   { label: 'Chờ xác nhận', icon: Clock,         color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  confirmed: { label: 'Đã xác nhận', icon: CheckCircle,   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  delivered: { label: 'Đã giao',     icon: Truck,         color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Đã hủy',      icon: XCircle,       color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const date = new Date(order.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-900">Đơn #{order.id}</p>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between border-t border-dashed border-gray-100 pt-3">
        <span className="text-sm text-gray-500">{order.items.length} sản phẩm</span>
        <span className="font-extrabold text-primary-700">{formatCurrency(order.total)}</span>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="w-full text-xs text-primary-600 hover:text-primary-800 font-semibold py-1 transition-colors"
      >
        {open ? 'Ẩn chi tiết ↑' : 'Xem chi tiết ↓'}
      </button>

      {open && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.productName} <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <span className="font-semibold text-gray-900">{formatCurrency(item.productPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DonHangPage() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (phone.trim().length < 9) {
      setError('Vui lòng nhập số điện thoại hợp lệ.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/user/orders?phone=${encodeURIComponent(phone.trim())}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Lỗi không xác định')
      setOrders(json.data)
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary-800 to-primary-600 shadow-lg">
        <div className="section-container flex items-center gap-4 h-14">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Trang chủ
          </Link>
          <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-lg ml-auto">
            <Store className="w-5 h-5" />
            Miu Shop
          </Link>
        </div>
      </header>

      <main className="section-container py-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Lịch sử đơn hàng</h1>
            <p className="text-sm text-gray-500">Nhập số điện thoại để xem đơn hàng của bạn</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="card p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Số điện thoại đặt hàng
          </label>
          <div className="flex gap-3">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0901234567"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>

        {searched && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="card p-10 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-500">Không tìm thấy đơn hàng nào</p>
                <p className="text-sm text-gray-400 mt-1">Kiểm tra lại số điện thoại bạn đã dùng khi đặt hàng</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">Tìm thấy <strong>{orders.length}</strong> đơn hàng</p>
                {orders.map((order) => <OrderCard key={order.id} order={order} />)}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
