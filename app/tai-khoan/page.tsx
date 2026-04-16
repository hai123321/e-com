'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { User, Package, Save, ChevronDown, ChevronUp, LogOut } from 'lucide-react'
import { useStore } from '@/lib/store'
import { updateProfile, fetchMyOrders, type UserOrder } from '@/lib/auth'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-blue-700'   },
  delivered: { label: 'Đã giao',       cls: 'bg-green-100 text-green-700'  },
  cancelled: { label: 'Đã huỷ',        cls: 'bg-red-100 text-red-700'      },
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
function formatDate(s: string) {
  return new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

function TaiKhoanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userToken, setUser, clearUser } = useStore()

  const [tab, setTab] = useState<'profile' | 'orders'>(() =>
    searchParams.get('tab') === 'orders' ? 'orders' : 'profile'
  )

  // Profile state
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Orders state
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) router.replace('/dang-nhap')
  }, [user, router])

  // Sync form with user data
  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setAvatar(user.avatar ?? '')
    }
  }, [user])

  // Load orders when tab switches
  useEffect(() => {
    if (tab === 'orders' && userToken && orders.length === 0) {
      setLoadingOrders(true)
      fetchMyOrders(userToken)
        .then(setOrders)
        .finally(() => setLoadingOrders(false))
    }
  }, [tab, userToken, orders.length])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToken) return
    setSaving(true)
    setSaveMsg('')
    try {
      const updated = await updateProfile(userToken, {
        name: name.trim() || undefined,
        avatar: avatar.trim() || null,
      })
      if (updated) {
        setUser(updated, userToken)
        setSaveMsg('Đã lưu thành công!')
      }
    } catch {
      setSaveMsg('Cập nhật thất bại, thử lại sau.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  if (!user) return null

  const initials = (user.name ?? '').charAt(0).toUpperCase() || '?'

  return (
    <main className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-10">
        <div className="section-container flex items-center gap-5">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-accent-400 flex items-center justify-center text-2xl font-extrabold ring-2 ring-white/30">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold">{user.name}</h1>
            <p className="text-white/70 text-sm">{user.email}</p>
          </div>
          <button
            onClick={() => { clearUser(); router.push('/') }}
            className="ml-auto flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="section-container py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-2xl p-1.5 border border-gray-200 w-fit shadow-sm">
          {([
            { key: 'profile', label: 'Thông tin cá nhân', Icon: User },
            { key: 'orders',  label: 'Lịch sử đơn hàng', Icon: Package },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key
                  ? 'bg-primary-700 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="max-w-lg">
            <div className="card p-8">
              <h2 className="font-bold text-lg text-gray-900 mb-6">Cập nhật thông tin</h2>
              <form onSubmit={handleSave} className="space-y-5">
                {/* Email (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-xs text-gray-400">(không thể thay đổi)</span>
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    URL ảnh đại diện
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                  {avatar && (
                    <div className="mt-3 flex items-center gap-3">
                      <Image
                        src={avatar}
                        alt="preview"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        onError={() => setAvatar('')}
                      />
                      <span className="text-xs text-gray-400">Xem trước</span>
                    </div>
                  )}
                </div>

                {saveMsg && (
                  <p className={`text-sm font-medium ${saveMsg.includes('thất bại') ? 'text-red-600' : 'text-green-600'}`}>
                    {saveMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="max-w-3xl">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="card p-12 text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-semibold">Chưa có đơn hàng nào</p>
                <p className="text-sm mt-1">Hãy mua sắm và quay lại đây để xem lịch sử</p>
                <a
                  href="/"
                  className="mt-4 inline-flex items-center gap-2 bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-800 transition-colors"
                >
                  Mua ngay
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">{orders.length} đơn hàng</p>
                {orders.map((order) => {
                  const st = STATUS_LABEL[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-600' }
                  const expanded = expandedOrder === order.id
                  return (
                    <div key={order.id} className="card overflow-hidden">
                      <button
                        onClick={() => setExpandedOrder(expanded ? null : order.id)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">Đơn #{order.id}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary-700">{formatPrice(order.total)}</span>
                          {expanded
                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                            : <ChevronDown className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                      </button>

                      {expanded && (
                        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-400 border-b border-gray-100">
                                <th className="text-left pb-2 font-medium">Sản phẩm</th>
                                <th className="text-right pb-2 font-medium">SL</th>
                                <th className="text-right pb-2 font-medium">Đơn giá</th>
                                <th className="text-right pb-2 font-medium">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {order.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-2 text-gray-700">{item.productName}</td>
                                  <td className="py-2 text-right text-gray-500">x{item.quantity}</td>
                                  <td className="py-2 text-right text-gray-500">{formatPrice(item.productPrice)}</td>
                                  <td className="py-2 text-right font-semibold text-gray-800">
                                    {formatPrice(item.productPrice * item.quantity)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-gray-200">
                                <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-gray-700">Tổng cộng</td>
                                <td className="pt-3 text-right font-bold text-primary-700">{formatPrice(order.total)}</td>
                              </tr>
                            </tfoot>
                          </table>
                          {order.note && (
                            <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                              Ghi chú: {order.note}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default function TaiKhoanPage() {
  return (
    <Suspense>
      <TaiKhoanContent />
    </Suspense>
  )
}
