'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { User, Package, Save, ChevronDown, ChevronUp, LogOut, Wallet, Camera, Phone, MapPin, Facebook, Star, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { updateProfile, fetchMyOrders, type UserOrder } from '@/lib/auth'
import { vietQrUrl } from '@/lib/payment'
import { CropModal } from '@/components/ui/CropModal'
import { SubscriptionSummary } from '@/components/subscription/SubscriptionSummary'
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard'
import { AddSubscriptionModal } from '@/components/subscription/AddSubscriptionModal'
import {
  fetchSubscriptions,
  fetchSubscriptionSummary,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  importFromOrders,
  type Subscription,
  type SubscriptionSummaryData,
} from '@/lib/subscriptions'

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
  const { user, userToken, setUser, clearUser, sessionHydrated } = useStore()

  const [tab, setTab] = useState<'profile' | 'orders' | 'topup' | 'subscriptions'>(() => {
    const p = searchParams.get('tab')
    if (p === 'orders')        return 'orders'
    if (p === 'topup')         return 'topup'
    if (p === 'subscriptions') return 'subscriptions'
    return 'profile'
  })
  const [topupAmount, setTopupAmount] = useState(0)

  // Subscriptions state
  const [subscriptions, setSubscriptions]   = useState<Subscription[]>([])
  const [subSummary, setSubSummary]         = useState<SubscriptionSummaryData | null>(null)
  const [loadingSubs, setLoadingSubs]       = useState(false)
  const [showSubModal, setShowSubModal]     = useState(false)
  const [editingSub, setEditingSub]         = useState<Subscription | null>(null)
  // Track whether we've already fetched to prevent infinite loop when list is empty
  const subsFetchedRef = useRef(false)

  // Profile state
  const [name, setName]             = useState('')
  const [avatar, setAvatar]         = useState('')
  const [phone, setPhone]           = useState('')
  const [address, setAddress]       = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [age, setAge]               = useState<string>('')
  const [gender, setGender]         = useState<string>('')
  const [occupation, setOccupation] = useState<string>('')
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')

  // Avatar upload
  const [cropSrc, setCropSrc]           = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Orders state
  const [orders, setOrders]           = useState<UserOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

  // Redirect if not logged in — wait for hydration first
  useEffect(() => {
    if (!sessionHydrated) return
    if (!user) router.replace('/dang-nhap')
  }, [sessionHydrated, user, router])

  // Sync form with user data
  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setAvatar(user.avatar ?? '')
      setPhone(user.phone ?? '')
      setAddress(user.address ?? '')
      setFacebookUrl(user.facebookUrl ?? '')
      setAge(user.age != null ? String(user.age) : '')
      setGender(user.gender ?? '')
      setOccupation(user.occupation ?? '')
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

  // Load subscriptions when tab switches — use a ref to avoid infinite loop
  // when the list is empty (subscriptions.length === 0 would always re-trigger)
  useEffect(() => {
    if (tab !== 'subscriptions' || !userToken || subsFetchedRef.current) return
    subsFetchedRef.current = true
    setLoadingSubs(true)
    Promise.all([
      fetchSubscriptions(userToken),
      fetchSubscriptionSummary(userToken),
    ])
      .then(([subs, summary]) => {
        setSubscriptions(subs)
        setSubSummary(summary)
      })
      .finally(() => setLoadingSubs(false))
  }, [tab, userToken])

  const refreshSubscriptions = async () => {
    if (!userToken) return
    const [subs, summary] = await Promise.all([
      fetchSubscriptions(userToken),
      fetchSubscriptionSummary(userToken),
    ])
    setSubscriptions(subs)
    setSubSummary(summary)
    // Keep ref true so auto-effect doesn't double-fetch on re-render
    subsFetchedRef.current = true
  }

  const handleDeleteSub = async (id: number) => {
    if (!userToken || !confirm('X\u00f3a g\u00f3i n\u00e0y?')) return
    await deleteSubscription(userToken, id)
    await refreshSubscriptions()
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToken) return
    setSaving(true)
    setSaveMsg('')
    try {
      const parsedAge = age.trim() ? parseInt(age.trim(), 10) : null
      const updated = await updateProfile(userToken, {
        name:        name.trim() || undefined,
        avatar:      avatar.trim() || null,
        phone:       phone.trim() || null,
        address:     address.trim() || null,
        facebookUrl: facebookUrl.trim() || null,
        age:         parsedAge,
        gender:      gender || null,
        occupation:  occupation.trim() || null,
      })
      if (updated) {
        setUser(updated as Parameters<typeof setUser>[0], userToken)
        setSaveMsg('Đã lưu thành công!')
      }
    } catch {
      setSaveMsg('Cập nhật thất bại, thử lại sau.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  if (!sessionHydrated || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  const initials = (user.name ?? '').charAt(0).toUpperCase() || '?'
  // Use local avatar state so header updates immediately after upload
  const displayAvatar = avatar || user.avatar || ''

  return (
    <main className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-10">
        <div className="section-container flex items-center gap-5">
          {displayAvatar ? (
            <Image
              src={displayAvatar}
              alt={user.name}
              width={64}
              height={64}
              unoptimized
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
            { key: 'profile',       label: 'Thông tin cá nhân', Icon: User    },
            { key: 'orders',        label: 'Lịch sử đơn hàng',  Icon: Package },
            { key: 'topup',         label: 'Nạp tiền',           Icon: Wallet  },
            { key: 'subscriptions', label: 'Gói đăng ký',        Icon: Star    },
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

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-gray-400" />
                    Link Facebook
                  </label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={e => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/your.profile"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tuổi
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="Nhập tuổi của bạn"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Giới tính
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nu">Nữ</option>
                    <option value="Khac">Khác</option>
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nghề nghiệp
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    placeholder="VD: Kỹ sư phần mềm, Giáo viên..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                {/* Avatar upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ảnh đại diện
                  </label>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = ev => setCropSrc(ev.target?.result as string)
                      reader.readAsDataURL(file)
                      e.target.value = ''
                    }}
                  />
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 shrink-0">
                      {displayAvatar ? (
                        <Image
                          src={displayAvatar}
                          alt="avatar"
                          fill
                          className="object-cover"
                          unoptimized
                          onError={() => setAvatar('')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-extrabold">
                          {(user.name ?? '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={uploadingAvatar}
                        onClick={() => avatarInputRef.current?.click()}
                        className="flex items-center gap-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 font-medium rounded-xl px-4 py-2 text-sm transition-colors disabled:opacity-60"
                      >
                        <Camera className="w-4 h-4" />
                        {uploadingAvatar ? 'Đang tải...' : 'Chọn ảnh mới'}
                      </button>
                      {displayAvatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors text-left"
                        >
                          Xóa ảnh đại diện
                        </button>
                      )}
                      <p className="text-xs text-gray-400">JPG, PNG · Tối đa 5MB</p>
                    </div>
                  </div>
                </div>

                {/* CropModal for avatar */}
                {cropSrc && (
                  <CropModal
                    src={cropSrc}
                    title="Cắt ảnh đại diện"
                    outputWidth={400}
                    onClose={() => setCropSrc(null)}
                    onConfirm={async (dataUrl) => {
                      if (!user) return
                      setUploadingAvatar(true)
                      setCropSrc(null)
                      try {
                        const res = await fetch('/api/upload-avatar', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: user.id, imageData: dataUrl }),
                        })
                        const json = await res.json()
                        if (!res.ok) throw new Error(json.error ?? 'Upload thất bại')
                        setAvatar(json.data.path)
                      } catch (err) {
                        setSaveMsg(err instanceof Error ? err.message : 'Upload thất bại')
                      } finally {
                        setUploadingAvatar(false)
                      }
                    }}
                  />
                )}

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

        {/* Top-up Tab */}
        {tab === 'topup' && (
          <div className="max-w-sm">
            <div className="card p-8 text-center">
              <h2 className="font-bold text-lg text-gray-900 mb-1">Nạp tiền vào tài khoản</h2>
              <p className="text-sm text-gray-500 mb-6">
                Chuyển khoản theo thông tin bên dưới. Số dư sẽ được cập nhật sau khi xác nhận.
              </p>

              <div className="mb-5 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số tiền nạp (VNĐ)</label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={topupAmount || ''}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  placeholder="100000"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                        topupAmount === amt
                          ? 'bg-primary-700 border-primary-700 text-white'
                          : 'border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-700'
                      }`}
                    >
                      {(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vietQrUrl(topupAmount, `topup ${user?.email ?? ''}`)}
                  alt="QR nạp tiền"
                  width={260}
                  height={300}
                  className="rounded-2xl border border-gray-200 shadow"
                />
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Nội dung chuyển khoản</p>
                <code className="font-bold text-primary-800 text-sm">
                  topup {user?.email ?? ''}
                </code>
              </div>

              <div className="text-left space-y-1.5 text-sm text-gray-500">
                <p>• Chuyển khoản đúng nội dung để được xác nhận tự động</p>
                <p>• Số dư cập nhật trong vòng 5–15 phút</p>
                <p>• Liên hệ hỗ trợ:{' '}
                  <a href="https://zalo.me/0383574189" target="_blank" rel="noopener noreferrer"
                    className="text-primary-700 font-semibold">Zalo 038.357.4189</a>
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Subscriptions Tab */}
        {tab === 'subscriptions' && (
          <div className="max-w-2xl">
            {loadingSubs ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {subSummary && subSummary.count > 0 && (
                  <SubscriptionSummary summary={subSummary} />
                )}

                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">{subscriptions.length} gu00f3i u0111u0103ng ku00fd</p>
                  <button
                    onClick={() => { setEditingSub(null); setShowSubModal(true) }}
                    className="flex items-center gap-1.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Thu00eam gu00f3i
                  </button>
                </div>

                {subscriptions.length === 0 ? (
                  <div className="card p-12 text-center text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-semibold">Chu01b0a cu00f3 gu00f3i u0111u0103ng ku00fd nu00e0o</p>
                    <p className="text-sm mt-1">Thu00eam gu00f3i thu1ee7 cu00f4ng hou1eb7c import tu1eeb lu1ecbch su1eed mua</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscriptions.map(sub => (
                      <SubscriptionCard
                        key={sub.id}
                        subscription={sub}
                        onEdit={s => { setEditingSub(s); setShowSubModal(true) }}
                        onDelete={handleDeleteSub}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {showSubModal && (
              <AddSubscriptionModal
                onClose={() => { setShowSubModal(false); setEditingSub(null) }}
                editTarget={editingSub}
                onSave={async (data) => {
                  if (!userToken) return
                  if (editingSub) {
                    await updateSubscription(userToken, editingSub.id, data)
                  } else {
                    await createSubscription(userToken, data)
                  }
                  await refreshSubscriptions()
                }}
                onImport={async () => {
                  if (!userToken) return
                  await importFromOrders(userToken)
                  await refreshSubscriptions()
                }}
              />
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
