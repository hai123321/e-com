'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { adminApi } from '@/lib/admin-api'

interface AdminUser {
  id: number
  name: string
  email: string
  phone?: string | null
  avatar?: string | null
  isActive: boolean
  walletBalance: number
  totalSpent: number
  orderCount: number
  subscriptionCount: number
  createdAt: string
}

interface UserOrder {
  id: number
  total: number
  status: string
  createdAt: string
  items?: { productName: string; qty: number; price: number }[]
}

interface UserSubscription {
  id: number
  serviceName: string
  status: string
  expiresAt: string
}

interface UserDetail extends AdminUser {
  orders?: UserOrder[]
  subscriptions?: UserSubscription[]
}

interface MonthlySpend {
  month: string
  amount: number
}

interface UserStats {
  totalSpent: number
  totalOrders: number
  avgOrderValue: number
  monthlySpending: MonthlySpend[]
}

// ─── Shared UI ──────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button' }:
  {
    children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'danger' | 'ghost' | 'success'
    size?: 'sm' | 'md'; disabled?: boolean; type?: 'button' | 'submit'
  }) => {
  const base = 'rounded-lg font-medium transition-colors disabled:opacity-50'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
  const variants = {
    primary: 'bg-primary-700 hover:bg-primary-600 text-white',
    danger: 'bg-red-900/50 hover:bg-red-800 text-red-400 border border-red-800',
    ghost: 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700',
    success: 'bg-green-900/50 hover:bg-green-800 text-green-400 border border-green-800',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {children}
    </button>
  )
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`bg-gray-900 border border-gray-800 rounded-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── User Detail Modal ──────────────────────────────────────────────────────
function UserDetailModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getUserDetail(userId),
      adminApi.getUserStats(userId),
    ]).then(([d, s]) => {
      setDetail(d.data ?? d)
      setStats(s.data ?? s)
    }).finally(() => setLoading(false))
  }, [userId])

  if (loading) return (
    <Modal title="Chi tiết tài khoản" onClose={onClose} wide>
      <p className="text-gray-500 text-sm text-center py-8">Đang tải...</p>
    </Modal>
  )

  if (!detail) return (
    <Modal title="Chi tiết tài khoản" onClose={onClose} wide>
      <p className="text-red-400 text-sm text-center py-8">Không tải được thông tin</p>
    </Modal>
  )

  return (
    <Modal title={`Chi tiết: ${detail.name}`} onClose={onClose} wide>
      <div className="space-y-6">
        {/* Profile */}
        <div className="flex items-center gap-4">
          {detail.avatar ? (
            <Image src={detail.avatar} alt={detail.name} width={56} height={56} className="rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-900/60 flex items-center justify-center text-primary-400 text-xl font-bold">
              {detail.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{detail.name}</p>
            <p className="text-gray-400 text-sm">{detail.email}</p>
            {detail.phone && <p className="text-gray-500 text-xs">{detail.phone}</p>}
          </div>
          <div className="ml-auto text-right">
            <span className={`text-xs px-2 py-1 rounded-lg border ${detail.isActive ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-red-900/40 text-red-400 border-red-800'}`}>
              {detail.isActive ? 'Active' : 'Bị khóa'}
            </span>
            <p className="text-gray-500 text-xs mt-1">Ngày tham gia: {new Date(detail.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-green-400 font-semibold">{(detail.walletBalance ?? 0).toLocaleString('vi-VN')}đ</p>
            <p className="text-gray-500 text-xs mt-0.5">Số dư ví</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-blue-400 font-semibold">{(detail.totalSpent ?? 0).toLocaleString('vi-VN')}đ</p>
            <p className="text-gray-500 text-xs mt-0.5">Tổng chi tiêu</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-white font-semibold">{detail.orderCount ?? 0}</p>
            <p className="text-gray-500 text-xs mt-0.5">Đơn hàng</p>
          </div>
        </div>

        {/* Monthly spending */}
        {stats?.monthlySpending && stats.monthlySpending.length > 0 && (
          <div>
            <h3 className="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider">Chi tiêu 6 tháng gần nhất</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Tháng', 'Số tiền'].map(h => (
                      <th key={h} className="text-left text-gray-500 font-medium py-2 px-3 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.monthlySpending.map(m => (
                    <tr key={m.month} className="border-b border-gray-800/50">
                      <td className="py-2 px-3 text-gray-400">{m.month}</td>
                      <td className="py-2 px-3 text-green-400">{m.amount.toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders */}
        {detail.orders && detail.orders.length > 0 && (
          <div>
            <h3 className="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider">Lịch sử mua hàng ({detail.orders.length} đơn)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['ID', 'Tổng tiền', 'Trạng thái', 'Ngày'].map(h => (
                      <th key={h} className="text-left text-gray-500 font-medium py-2 px-3 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.orders.slice(0, 10).map(o => (
                    <tr key={o.id} className="border-b border-gray-800/50">
                      <td className="py-2 px-3 text-gray-500 font-mono text-xs">#{o.id}</td>
                      <td className="py-2 px-3 text-green-400">{o.total.toLocaleString('vi-VN')}đ</td>
                      <td className="py-2 px-3 text-gray-400 text-xs">{o.status}</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscriptions */}
        {detail.subscriptions && detail.subscriptions.length > 0 && (
          <div>
            <h3 className="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider">Subscriptions ({detail.subscriptions.length})</h3>
            <div className="space-y-2">
              {detail.subscriptions.map(s => (
                <div key={s.id} className="bg-gray-800/50 rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{s.serviceName}</p>
                    <p className="text-gray-500 text-xs">Hết hạn: {new Date(s.expiresAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-lg border ${s.status === 'active' ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Reset Password Modal ───────────────────────────────────────────────────
function ResetPasswordModal({ userId, userName, onClose }: { userId: number; userName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const doReset = async () => {
    setLoading(true)
    try {
      const r = await adminApi.resetUserPassword(userId)
      setNewPassword(r.newPassword ?? r.data?.newPassword)
    } finally {
      setLoading(false)
    }
  }

  const copyPwd = () => {
    if (!newPassword) return
    navigator.clipboard.writeText(newPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal title={`Reset mật khẩu: ${userName}`} onClose={onClose}>
      {newPassword ? (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Mật khẩu mới đã được tạo. Hãy copy và gửi cho người dùng:</p>
          <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <code className="text-green-400 font-mono text-lg flex-1">{newPassword}</code>
            <Btn size="sm" variant="ghost" onClick={copyPwd}>{copied ? 'Đã copy!' : 'Copy'}</Btn>
          </div>
          <Btn onClick={onClose}>Đóng</Btn>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Thao tác này sẽ tạo mật khẩu mới ngẫu nhiên và ghi đè mật khẩu cũ của <strong className="text-white">{userName}</strong>.
          </p>
          <div className="flex gap-3">
            <Btn onClick={doReset} disabled={loading}>{loading ? 'Đang xử lý...' : 'Xác nhận reset'}</Btn>
            <Btn variant="ghost" onClick={onClose}>Hủy</Btn>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Users Tab ───────────────────────────────────────────────────────────────
type FilterType = 'all' | 'active' | 'locked'

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [resetId, setResetId] = useState<number | null>(null)
  const [resetName, setResetName] = useState('')
  const [toggling, setToggling] = useState<number | null>(null)

  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: { page: number; limit: number; search?: string; isActive?: boolean } = { page, limit: LIMIT }
      if (search) params.search = search
      if (filter === 'active') params.isActive = true
      if (filter === 'locked') params.isActive = false
      const r = await adminApi.getUsers(params)
      setUsers(r.data ?? [])
      setTotal(r.meta?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, search, filter])

  useEffect(() => { load() }, [load])

  const toggleStatus = async (u: AdminUser) => {
    setToggling(u.id)
    try {
      await adminApi.updateUserStatus(u.id, !u.isActive)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: !x.isActive } : x))
    } finally {
      setToggling(null)
    }
  }

  const openReset = (u: AdminUser) => { setResetId(u.id); setResetName(u.name) }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Tìm theo email hoặc tên..."
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex rounded-xl overflow-hidden border border-gray-700">
          {(['all', 'active', 'locked'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-2 text-xs font-medium transition-colors ${filter === f ? 'bg-primary-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
            >
              {f === 'all' ? 'Tất cả' : f === 'active' ? 'Active' : 'Bị khóa'}
            </button>
          ))}
        </div>
        {total > 0 && <span className="text-gray-600 text-xs ml-auto">{total} tài khoản</span>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['Tài khoản', 'SĐT', 'Số dư ví', 'Tổng chi', 'Trạng thái', 'Ngày đăng ký', ''].map(h => (
                <th key={h} className="text-left text-gray-500 font-medium py-3 px-3 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="text-center text-gray-600 py-8 text-sm">Đang tải...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-600 py-8 text-sm">Không tìm thấy tài khoản nào</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    {u.avatar ? (
                      <Image src={u.avatar} alt={u.name} width={28} height={28} className="rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-900/50 flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium text-xs">{u.name}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-gray-400 text-xs">{u.phone ?? '—'}</td>
                <td className="py-3 px-3 text-blue-400 text-xs">{(u.walletBalance ?? 0).toLocaleString('vi-VN')}đ</td>
                <td className="py-3 px-3 text-green-400 text-xs">{(u.totalSpent ?? 0).toLocaleString('vi-VN')}đ</td>
                <td className="py-3 px-3">
                  <span className={`text-xs px-2 py-1 rounded-lg border ${u.isActive ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-red-900/40 text-red-400 border-red-800'}`}>
                    {u.isActive ? 'Active' : 'Bị khóa'}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="py-3 px-3">
                  <div className="flex gap-1.5">
                    <Btn size="sm" variant="ghost" onClick={() => setDetailId(u.id)}>Chi tiết</Btn>
                    <Btn
                      size="sm"
                      variant={u.isActive ? 'danger' : 'success'}
                      disabled={toggling === u.id}
                      onClick={() => toggleStatus(u)}
                    >
                      {toggling === u.id ? '...' : u.isActive ? 'Khóa' : 'Kích hoạt'}
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => openReset(u)}>Reset PW</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Btn size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</Btn>
          <span className="text-gray-500 text-xs">{page} / {totalPages}</span>
          <Btn size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau →</Btn>
        </div>
      )}

      {/* Modals */}
      {detailId != null && <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} />}
      {resetId != null && <ResetPasswordModal userId={resetId} userName={resetName} onClose={() => setResetId(null)} />}
    </>
  )
}
