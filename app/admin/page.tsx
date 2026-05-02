'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { adminApi } from '@/lib/admin-api'
import { MediaTab } from './MediaTab'
import { UsersTab } from './UsersTab'
import { AnalyticsTab } from './AnalyticsTab'

// ─── Types ─────────────────────────────────────────────────────────────────
interface Order {
  id: number; customerName: string; customerEmail: string; status: string
  total: number; createdAt: string
  items?: { productName: string; qty: number; price: number }[]
}
interface Product {
  id: number; name: string; price: number; stock: number; category: string
  description: string; image: string; groupKey: string; isActive: boolean
  featuredPriority: number; durationMonths: number; soldCount?: number
}
interface Guide {
  id: number; sortOrder: number; type: string
  descriptionVi: string; descriptionEn: string; descriptionCn: string
}
interface PricingRule {
  id: number; name: string; ruleType: string; scopeType: string
  scopeValue?: string; priority: number; isActive: boolean; params: Record<string, unknown>
  description: string; startsAt?: string; endsAt?: string
}
interface Promotion {
  id: number; code: string; discountType: string; discountValue: number
  minOrderValue?: number; maxUses?: number; usedCount: number
  isActive: boolean; expiresAt?: string; createdAt: string
}

const TABS = ['Dashboard', 'Đơn hàng', 'Sản phẩm', 'Thành viên', 'Hướng dẫn', 'Cấu hình giá', 'Khuyến mại', 'Media'] as const
type Tab = typeof TABS[number]

const STATUS_LABELS: Record<string, string> = {
  pending:   'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  delivered: 'Hoàn thành',
  cancelled: 'Đã hủy',
}
const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  confirmed: 'bg-blue-900/40 text-blue-400 border-blue-800',
  delivered: 'bg-green-900/40 text-green-400 border-green-800',
  cancelled: 'bg-red-900/40 text-red-400 border-red-800',
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

const Input = ({ label, value, onChange, type = 'text', placeholder, required, rows }:
  {
    label: string; value: string | number; onChange: (v: string) => void
    type?: string; placeholder?: string; required?: boolean; rows?: number
  }) => (
  <div>
    <label className="text-gray-400 text-xs font-medium mb-1 block">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {rows ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-vertical" />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
    )}
  </div>
)

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h2 className="text-white font-semibold">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

// ─── Orders Tab ─────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [deliveryModal, setDeliveryModal] = useState<{ orderId: number } | null>(null)
  const [deliveryForm, setDeliveryForm] = useState({ accountInfo: '', instructions: '' })
  const [deliverySaving, setDeliverySaving] = useState(false)

  const load = useCallback(async () => {
    try { const r = await adminApi.getOrders(); setOrders(r.data ?? []) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const applyStatus = (id: number, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  const updateStatus = async (id: number, status: string) => {
    if (status === 'delivered') {
      setDeliveryForm({ accountInfo: '', instructions: '' })
      setDeliveryModal({ orderId: id })
      return
    }
    await adminApi.updateOrderStatus(id, status)
    applyStatus(id, status)
  }

  const confirmDelivery = async () => {
    if (!deliveryModal) return
    setDeliverySaving(true)
    try {
      await adminApi.updateOrderStatus(deliveryModal.orderId, 'delivered', {
        accountInfo: deliveryForm.accountInfo || undefined,
        instructions: deliveryForm.instructions || undefined,
      })
      applyStatus(deliveryModal.orderId, 'delivered')
      setDeliveryModal(null)
    } finally {
      setDeliverySaving(false)
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Đang tải...</p>

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['ID', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Thời gian', ''].map(h => (
                <th key={h} className="text-left text-gray-500 font-medium py-3 px-3 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-600 py-8 text-sm">Chưa có đơn hàng nào</td></tr>
            )}
            {orders.map(o => (
              <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-3 px-3 text-gray-400 font-mono">#{o.id}</td>
                <td className="py-3 px-3">
                  <p className="text-white font-medium">{o.customerName}</p>
                  <p className="text-gray-500 text-xs">{o.customerEmail}</p>
                </td>
                <td className="py-3 px-3 text-green-400 font-semibold">
                  {o.total.toLocaleString('vi-VN')}đ
                </td>
                <td className="py-3 px-3">
                  <span className={`border rounded-lg px-2 py-1 text-xs font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500 text-xs">
                  {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="py-3 px-3">
                  <Btn size="sm" variant="ghost" onClick={() => setSelected(o)}>Chi tiết</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <Modal title={`Đơn hàng #${selected.id}`} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500 text-xs">Khách hàng</p><p className="text-white">{selected.customerName}</p></div>
              <div><p className="text-gray-500 text-xs">Email</p><p className="text-white">{selected.customerEmail}</p></div>
              <div><p className="text-gray-500 text-xs">Tổng tiền</p><p className="text-green-400 font-semibold">{selected.total.toLocaleString('vi-VN')}đ</p></div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Trạng thái</p>
                <select
                  value={selected.status}
                  onChange={e => updateStatus(selected.id, e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delivery details modal */}
      {deliveryModal && (
        <Modal title="Hoàn thành đơn hàng" onClose={() => setDeliveryModal(null)}>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Điền thông tin tài khoản / hướng dẫn để gửi kèm thông báo cho khách hàng.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">
                📋 Thông tin tài khoản
                <span className="text-gray-600 font-normal ml-1">(email, mật khẩu, link…)</span>
              </label>
              <textarea
                rows={4}
                placeholder={"Email: abc@example.com\nMật khẩu: Abc@12345\nLink đăng nhập: https://..."}
                value={deliveryForm.accountInfo}
                onChange={e => setDeliveryForm(f => ({ ...f, accountInfo: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">
                📖 Hướng dẫn sử dụng
                <span className="text-gray-600 font-normal ml-1">(tuỳ chọn)</span>
              </label>
              <textarea
                rows={3}
                placeholder={"1. Truy cập link đăng nhập\n2. Nhập email và mật khẩu\n3. Đổi mật khẩu sau khi vào"}
                value={deliveryForm.instructions}
                onChange={e => setDeliveryForm(f => ({ ...f, instructions: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeliveryModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={confirmDelivery}
                disabled={deliverySaving}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                {deliverySaving ? 'Đang lưu...' : '✓ Xác nhận hoàn thành'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

// ─── Products Tab ─────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showBestSellers, setShowBestSellers] = useState(false)
  const emptyForm = { name: '', price: 0, stock: 0, category: 'AI', description: '', image: '', groupKey: '', isActive: true, featuredPriority: 0, durationMonths: 1 }
  const [form, setForm] = useState<Omit<Product, 'id'>>(emptyForm)

  useEffect(() => {
    adminApi.getProducts().then(r => { setProducts(r.data ?? []); setLoading(false) })
  }, [])

  const openCreate = () => { setForm(emptyForm); setCreating(true) }
  const openEdit = (p: Product) => { setForm(p); setEditing(p) }

  const save = async () => {
    if (editing) {
      const r = await adminApi.updateProduct(editing.id, form)
      setProducts(prev => prev.map(p => p.id === editing.id ? r.data : p))
      setEditing(null)
    } else {
      const r = await adminApi.createProduct(form)
      setProducts(prev => [r.data, ...prev])
      setCreating(false)
    }
  }

  const del = async (id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return
    await adminApi.deleteProduct(id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const f = (key: keyof typeof form) => (v: string) =>
    setForm(prev => ({ ...prev, [key]: ['price', 'stock', 'featuredPriority', 'durationMonths'].includes(key) ? parseInt(v) || 0 : v }))

  const productFormJsx = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tên sản phẩm" value={form.name} onChange={f('name')} required />
        <Input label="Nhóm (group_key)" value={form.groupKey} onChange={f('groupKey')} placeholder="netflix" />
        <Input label="Giá (VND)" value={form.price} onChange={f('price')} type="number" required />
        <Input label="Tồn kho" value={form.stock} onChange={f('stock')} type="number" required />
        <Input label="Danh mục" value={form.category} onChange={f('category')} placeholder="AI" />
        <Input label="Ảnh (URL)" value={form.image} onChange={f('image')} placeholder="/api/logos/netflix.jpg" />
        <Input label="Ưu tiên trang chủ (0=ẩn, 1-10=hiện)" value={form.featuredPriority} onChange={f('featuredPriority')} type="number" />
        <div>
          <label className="text-gray-400 text-xs font-medium mb-1 block">Thời hạn (tháng)</label>
          <select value={form.durationMonths} onChange={e => setForm(p => ({ ...p, durationMonths: parseInt(e.target.value) }))}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value={1}>1 tháng</option>
            <option value={3}>3 tháng</option>
            <option value={6}>6 tháng</option>
            <option value={12}>12 tháng</option>
          </select>
        </div>
      </div>
      <Input label="Mô tả" value={form.description} onChange={f('description')} rows={3} />
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isActive" checked={form.isActive}
          onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
          className="rounded" />
        <label htmlFor="isActive" className="text-gray-400 text-sm">Đang bán</label>
      </div>
      <div className="flex gap-3 pt-2">
        <Btn onClick={save} type="button">Lưu</Btn>
        <Btn variant="ghost" onClick={() => { setEditing(null); setCreating(false) }}>Hủy</Btn>
      </div>
    </div>
  )

  const bestSellers = [...products]
    .filter(p => (p.soldCount ?? 0) > 0)
    .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
    .slice(0, 10)

  if (loading) return <p className="text-gray-500 text-sm">Đang tải...</p>

  return (
    <>
      {/* Best Sellers toggle section */}
      <div className="mb-6">
        <button
          onClick={() => setShowBestSellers(s => !s)}
          className="flex items-center gap-2 text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          <span>🏆 Bán chạy nhất</span>
          <span className="text-gray-600 text-xs">{showBestSellers ? '▲ Ẩn' : '▼ Xem'}</span>
        </button>
        {showBestSellers && (
          <div className="mt-3 bg-gray-800/40 border border-gray-800 rounded-2xl p-4">
            {bestSellers.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">Chưa có dữ liệu bán hàng</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {['Hạng', 'Sản phẩm', 'Đã bán', 'Doanh thu'].map(h => (
                        <th key={h} className="text-left text-gray-500 font-medium py-2 px-3 text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bestSellers.map((p, i) => (
                      <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 px-3">
                          <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-yellow-700' : 'text-gray-600'}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {p.image && (
                              <Image src={p.image} alt={p.name} width={24} height={24} className="rounded object-cover shrink-0" />
                            )}
                            <span className="text-white text-xs font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-blue-400 font-semibold text-xs">{(p.soldCount ?? 0).toLocaleString('vi-VN')}</td>
                        <td className="py-2 px-3 text-green-400 text-xs">{((p.soldCount ?? 0) * p.price).toLocaleString('vi-VN')}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..."
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <Btn onClick={openCreate}>+ Thêm sản phẩm</Btn>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['Tên', 'Giá', 'Tồn kho', 'Nhóm', 'Trạng thái', ''].map(h => (
                <th key={h} className="text-left text-gray-500 font-medium py-3 px-3 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-3 px-3 text-white font-medium">{p.name}</td>
                <td className="py-3 px-3 text-green-400">{p.price.toLocaleString('vi-VN')}đ</td>
                <td className="py-3 px-3 text-gray-400">{p.stock}</td>
                <td className="py-3 px-3 text-gray-500 text-xs font-mono">{p.groupKey}</td>
                <td className="py-3 px-3">
                  <span className={`text-xs px-2 py-1 rounded-lg border ${p.isActive ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                    {p.isActive ? 'Đang bán' : 'Ẩn'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex gap-2">
                    <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>Sửa</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(p.id)}>Xóa</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <Modal title={editing ? `Sửa: ${editing.name}` : 'Thêm sản phẩm mới'} onClose={() => { setCreating(false); setEditing(null) }}>
          {productFormJsx}
        </Modal>
      )}
    </>
  )
}

// ─── Guides Tab ─────────────────────────────────────────────────────────────
function GuidesTab() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [editing, setEditing] = useState<Guide | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const empty = { sortOrder: 0, type: '', descriptionVi: '', descriptionEn: '', descriptionCn: '' }
  const [form, setForm] = useState<Omit<Guide, 'id'>>(empty)

  useEffect(() => {
    adminApi.getGuides().then(r => { setGuides(r.data ?? []); setLoading(false) })
  }, [])

  const save = async () => {
    if (editing) {
      const r = await adminApi.updateGuide(editing.id, form)
      setGuides(prev => prev.map(g => g.id === editing.id ? r.data : g))
      setEditing(null)
    } else {
      const r = await adminApi.createGuide(form)
      setGuides(prev => [...prev, r.data])
      setCreating(false)
    }
  }

  const del = async (id: number) => {
    if (!confirm('Xóa hướng dẫn này?')) return
    await adminApi.deleteGuide(id)
    setGuides(prev => prev.filter(g => g.id !== id))
  }

  const f = (key: keyof typeof form) => (v: string) =>
    setForm(prev => ({ ...prev, [key]: key === 'sortOrder' ? parseInt(v) || 0 : v }))

  const guideFormJsx = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Thứ tự" value={form.sortOrder} onChange={f('sortOrder')} type="number" />
        <Input label="Tiêu đề" value={form.type} onChange={f('type')} required />
      </div>
      <Input label="Nội dung (Tiếng Việt)" value={form.descriptionVi} onChange={f('descriptionVi')} rows={5} />
      <Input label="Nội dung (English)" value={form.descriptionEn} onChange={f('descriptionEn')} rows={5} />
      <Input label="内容 (中文)" value={form.descriptionCn} onChange={f('descriptionCn')} rows={5} />
      <div className="flex gap-3 pt-2">
        <Btn onClick={save}>Lưu</Btn>
        <Btn variant="ghost" onClick={() => { setEditing(null); setCreating(false) }}>Hủy</Btn>
      </div>
    </div>
  )

  if (loading) return <p className="text-gray-500 text-sm">Đang tải...</p>

  return (
    <>
      <div className="flex justify-end mb-4">
        <Btn onClick={() => { setForm(empty); setCreating(true) }}>+ Thêm hướng dẫn</Btn>
      </div>
      <div className="space-y-3">
        {guides.map(g => (
          <div key={g.id} className="bg-gray-800/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-gray-600 text-xs font-mono mr-3">#{g.sortOrder}</span>
                <span className="text-white font-medium text-sm">{g.type}</span>
                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{g.descriptionVi.slice(0, 120)}...</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <Btn size="sm" variant="ghost" onClick={() => { setForm(g); setEditing(g) }}>Sửa</Btn>
                <Btn size="sm" variant="danger" onClick={() => del(g.id)}>Xóa</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
      {(creating || editing) && (
        <Modal title={editing ? 'Sửa hướng dẫn' : 'Thêm hướng dẫn mới'} onClose={() => { setEditing(null); setCreating(false) }}>
          {guideFormJsx}
        </Modal>
      )}
    </>
  )
}

// ─── Pricing Rules Tab ──────────────────────────────────────────────────────
const KNOWN_CATEGORIES = ['AI', 'Streaming', 'Học tập', 'Thiết kế', 'VPN', 'Năng suất', 'Lưu trữ', 'Khác']

function PricingRulesTab() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<PricingRule | null>(null)
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Array<{ key: string; count: number; category: string }>>([])
  const [groupSearch, setGroupSearch] = useState('')
  // Multi-select: internal array, joined to comma string on save
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const emptyForm = { name: '', description: '', ruleType: 'multiplier', params: { factor: 1.2 }, scopeType: 'global', scopeValue: '', priority: 0, isActive: true, startsAt: '', endsAt: '' }
  const [form, setForm] = useState<Omit<PricingRule, 'id'>>(emptyForm as unknown as Omit<PricingRule, 'id'>)
  const [paramsText, setParamsText] = useState('{"factor": 1.2}')

  const toggleGroup = (key: string) =>
    setSelectedGroups(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  useEffect(() => {
    adminApi.getPricingRules().then(r => { setRules(r.data ?? []); setLoading(false) })
    adminApi.getProducts().then(r => {
      const products: Product[] = r.data ?? r.products ?? []
      const map = new Map<string, { count: number; category: string }>()
      for (const p of products) {
        if (!p.groupKey) continue
        const existing = map.get(p.groupKey)
        map.set(p.groupKey, { count: (existing?.count ?? 0) + 1, category: p.category || '' })
      }
      setGroups(
        Array.from(map.entries())
          .map(([key, { count, category }]) => ({ key, count, category }))
          .sort((a, b) => a.key.localeCompare(b.key))
      )
    })
  }, [])

  const RULE_EXAMPLES: Record<string, string> = {
    multiplier: '{"factor": 1.5}',
    fixed_add: '{"amount": 50000}',
    stock_based: '{"tiers":[{"min_stock":100,"discount_percent":20},{"min_stock":50,"discount_percent":10},{"min_stock":0,"discount_percent":0}]}',
    time_based: '{"schedule":[{"days":[6,0],"discount_percent":15},{"days":[1,2,3,4,5],"hours":[9,10,11,12,13,14,15,16,17],"discount_percent":5}]}',
    manual_override: '{"fixed_price": 199000}',
  }

  const RULE_LABELS: Record<string, string> = {
    multiplier: 'Nhân hệ số (giá = gốc × factor)',
    fixed_add: 'Cộng/trừ cố định (giá = gốc + amount)',
    stock_based: 'Theo tồn kho (giảm % khi còn nhiều)',
    time_based: 'Theo thời gian (giờ/ngày trong tuần)',
    manual_override: 'Ghi đè cố định (bỏ qua giá gốc)',
  }

  const save = async () => {
    let params: Record<string, unknown>
    try { params = JSON.parse(paramsText) } catch { alert('Params JSON không hợp lệ'); return }
    const scopeValue = form.scopeType === 'group'
      ? selectedGroups.join(',')
      : form.scopeValue
    if (form.scopeType === 'group' && selectedGroups.length === 0) {
      alert('Vui lòng chọn ít nhất một nhóm sản phẩm'); return
    }
    const data = { ...form, scopeValue, params }
    if (editing) {
      const r = await adminApi.updatePricingRule(editing.id, data)
      setRules(prev => prev.map(rl => rl.id === editing.id ? r.data : rl))
      setEditing(null)
    } else {
      const r = await adminApi.createPricingRule(data)
      setRules(prev => [r.data, ...prev])
      setCreating(false)
    }
  }

  const del = async (id: number) => {
    if (!confirm('Xóa rule này?')) return
    await adminApi.deletePricingRule(id)
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const openEdit = (r: PricingRule) => {
    setForm(r)
    setParamsText(JSON.stringify(r.params, null, 2))
    setSelectedGroups(
      r.scopeType === 'group' && r.scopeValue
        ? r.scopeValue.split(',').map(k => k.trim()).filter(Boolean)
        : []
    )
    setEditing(r)
  }

  const openCreate = () => {
    setForm(emptyForm as unknown as Omit<PricingRule, 'id'>)
    setParamsText(RULE_EXAMPLES.multiplier)
    setSelectedGroups([])
    setCreating(true)
  }

  const f = (key: string) => (v: string) => setForm(prev => ({ ...prev, [key]: ['priority'].includes(key) ? parseInt(v) || 0 : v }))

  const ruleFormJsx = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tên rule" value={form.name} onChange={f('name')} required />
        <div>
          <label className="text-gray-400 text-xs font-medium mb-1 block">Loại rule<span className="text-red-500 ml-0.5">*</span></label>
          <select value={form.ruleType} onChange={e => { f('ruleType')(e.target.value); setParamsText(RULE_EXAMPLES[e.target.value] ?? '{}') }}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm">
            {Object.entries(RULE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs font-medium mb-1 block">Phạm vi áp dụng</label>
          <select value={form.scopeType}
            onChange={e => { f('scopeType')(e.target.value); f('scopeValue')(''); setGroupSearch(''); setSelectedGroups([]) }}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm">
            <option value="global">🌐 Toàn bộ sản phẩm</option>
            <option value="category">📂 Theo danh mục</option>
            <option value="group">📦 Theo nhóm sản phẩm (group_key)</option>
            <option value="product">🎯 Theo sản phẩm cụ thể (ID)</option>
          </select>
        </div>

        {/* Category dropdown */}
        {form.scopeType === 'category' && (
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Danh mục<span className="text-red-500 ml-0.5">*</span></label>
            <select value={form.scopeValue ?? ''}
              onChange={e => f('scopeValue')(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm">
              <option value="">-- Chọn danh mục --</option>
              {KNOWN_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {/* Group key multi-select */}
        {form.scopeType === 'group' && (
          <div className="col-span-2">
            <label className="text-gray-400 text-xs font-medium mb-2 block">
              Nhóm sản phẩm (group_key)<span className="text-red-500 ml-0.5">*</span>
              <span className="ml-2 text-gray-600 font-normal">
                {selectedGroups.length > 0
                  ? <span className="text-primary-400">{selectedGroups.length} đã chọn</span>
                  : `${groups.length} nhóm`}
              </span>
            </label>

            {/* Selected tags */}
            {selectedGroups.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedGroups.map(k => (
                  <span key={k} className="inline-flex items-center gap-1 bg-primary-900/50 border border-primary-700 text-primary-300 text-xs font-mono px-2 py-0.5 rounded-lg">
                    {k}
                    <button type="button" onClick={() => toggleGroup(k)} className="hover:text-red-400 ml-0.5">✕</button>
                  </span>
                ))}
                <button type="button" onClick={() => setSelectedGroups([])} className="text-[10px] text-gray-600 hover:text-red-400 px-1">Bỏ tất cả</button>
              </div>
            )}

            {/* Search */}
            <input
              type="text"
              value={groupSearch}
              onChange={e => setGroupSearch(e.target.value)}
              placeholder="🔍 Tìm nhóm... (netflix, chatgpt, ...)"
              className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 text-sm mb-2 placeholder:text-gray-600"
            />

            {/* Scrollable checkbox list */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-y-auto max-h-52">
              {groups
                .filter(g => !groupSearch || g.key.includes(groupSearch.toLowerCase()) || g.category.toLowerCase().includes(groupSearch.toLowerCase()))
                .map(g => {
                  const checked = selectedGroups.includes(g.key)
                  return (
                    <label
                      key={g.key}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-800 transition-colors border-b border-gray-800/50 last:border-0 ${
                        checked ? 'bg-primary-900/30' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGroup(g.key)}
                        className="accent-primary-500 w-3.5 h-3.5 shrink-0"
                      />
                      <span className={`font-mono text-xs flex-1 ${checked ? 'text-primary-300' : 'text-gray-400'}`}>{g.key}</span>
                      <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded shrink-0">{g.category}</span>
                      <span className="text-[10px] text-gray-600 shrink-0">{g.count} SP</span>
                    </label>
                  )
                })}
              {groups.filter(g => !groupSearch || g.key.includes(groupSearch.toLowerCase()) || g.category.toLowerCase().includes(groupSearch.toLowerCase())).length === 0 && (
                <p className="text-center text-gray-600 text-xs py-4">Không tìm thấy nhóm nào</p>
              )}
            </div>
          </div>
        )}

        {/* Product ID input */}
        {form.scopeType === 'product' && (
          <Input label="ID sản phẩm" value={form.scopeValue ?? ''} onChange={f('scopeValue')} placeholder="123" />
        )}
        <Input label="Độ ưu tiên (số lớn = ưu tiên hơn)" value={form.priority} onChange={f('priority')} type="number" />
        <div>
          <label className="text-gray-400 text-xs font-medium mb-1 block">Kích hoạt</label>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            <span className="text-gray-400 text-sm">Đang áp dụng</span>
          </div>
        </div>
        <Input label="Bắt đầu" value={form.startsAt ?? ''} onChange={f('startsAt')} type="datetime-local" />
        <Input label="Kết thúc" value={form.endsAt ?? ''} onChange={f('endsAt')} type="datetime-local" />
      </div>
      <div>
        <label className="text-gray-400 text-xs font-medium mb-1 block">
          Params (JSON) — <span className="text-gray-600">{RULE_LABELS[form.ruleType]}</span>
        </label>
        <textarea value={paramsText} onChange={e => setParamsText(e.target.value)} rows={6}
          className="w-full bg-gray-950 border border-gray-700 text-green-400 font-mono rounded-xl px-3 py-2 text-xs resize-vertical" />
      </div>
      <div className="flex gap-3 pt-2">
        <Btn onClick={save}>Lưu</Btn>
        <Btn variant="ghost" onClick={() => { setEditing(null); setCreating(false) }}>Hủy</Btn>
      </div>
    </div>
  )

  if (loading) return <p className="text-gray-500 text-sm">Đang tải...</p>

  return (
    <>
      <div className="flex justify-end mb-4">
        <Btn onClick={openCreate}>+ Thêm rule</Btn>
      </div>
      <div className="space-y-3">
        {rules.length === 0 && <p className="text-gray-600 text-sm text-center py-8">Chưa có pricing rule nào</p>}
        {rules.map(r => (
          <div key={r.id} className={`bg-gray-800/50 border rounded-xl p-4 ${r.isActive ? 'border-gray-700' : 'border-gray-800 opacity-60'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium text-sm">{r.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg border ${r.isActive ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                    {r.isActive ? 'Đang áp dụng' : 'Tắt'}
                  </span>
                  <span className="text-xs bg-primary-900/40 text-primary-400 border border-primary-800 px-2 py-0.5 rounded-lg">
                    {RULE_LABELS[r.ruleType] ?? r.ruleType}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">
                  Phạm vi:{' '}
                  {r.scopeType === 'global'   ? '🌐 Tất cả sản phẩm' :
                   r.scopeType === 'category' ? `📂 Danh mục: ${r.scopeValue}` :
                   r.scopeType === 'group'    ? (
                     <span className="inline-flex items-center gap-1 flex-wrap">
                       📦
                       {(r.scopeValue ?? '').split(',').filter(Boolean).map(k => (
                         <span key={k} className="font-mono text-primary-400 bg-primary-900/30 px-1.5 py-0.5 rounded text-[11px]">{k.trim()}</span>
                       ))}
                     </span>
                   ) :
                   `🎯 Sản phẩm ID: ${r.scopeValue}`}
                  {' '}· Ưu tiên: {r.priority}
                </p>
                <p className="text-gray-600 text-xs font-mono mt-1">{JSON.stringify(r.params)}</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}>Sửa</Btn>
                <Btn size="sm" variant="danger" onClick={() => del(r.id)}>Xóa</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
      {(creating || editing) && (
        <Modal title={editing ? 'Sửa pricing rule' : 'Thêm pricing rule'} onClose={() => { setEditing(null); setCreating(false) }}>
          {ruleFormJsx}
        </Modal>
      )}
    </>
  )
}

// ─── Promotions Tab ─────────────────────────────────────────────────────────
function PromotionsTab() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)
  const empty = { code: '', discountType: 'percent', discountValue: 10, minOrderValue: 0, maxUses: 0, isActive: true, expiresAt: '' }
  const [form, setForm] = useState<Omit<Promotion, 'id' | 'usedCount' | 'createdAt'>>(empty as unknown as Omit<Promotion, 'id' | 'usedCount' | 'createdAt'>)

  useEffect(() => {
    adminApi.getPromotions().then(r => { setPromos(r.data ?? []); setLoading(false) })
  }, [])

  const save = async () => {
    const data = {
      ...form,
      discountValue: parseInt(String(form.discountValue)) || 0,
      minOrderValue: form.minOrderValue ? parseInt(String(form.minOrderValue)) : null,
      maxUses: form.maxUses ? parseInt(String(form.maxUses)) : null,
      expiresAt: form.expiresAt || null,
    }
    if (editing) {
      const r = await adminApi.updatePromotion(editing.id, data)
      setPromos(prev => prev.map(p => p.id === editing.id ? r.data : p))
      setEditing(null)
    } else {
      const r = await adminApi.createPromotion(data)
      setPromos(prev => [r.data, ...prev])
      setCreating(false)
    }
  }

  const del = async (id: number) => {
    if (!confirm('Xóa mã khuyến mại này?')) return
    await adminApi.deletePromotion(id)
    setPromos(prev => prev.filter(p => p.id !== id))
  }

  const f = (key: string) => (v: string) => setForm(prev => ({ ...prev, [key]: v }))

  const promoFormJsx = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Mã giảm giá" value={form.code} onChange={f('code')} placeholder="SALE20" required />
        <div>
          <label className="text-gray-400 text-xs font-medium mb-1 block">Loại giảm giá</label>
          <select value={form.discountType} onChange={e => f('discountType')(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm">
            <option value="percent">Phần trăm (%)</option>
            <option value="fixed">Số tiền cố định (VND)</option>
          </select>
        </div>
        <Input label={form.discountType === 'percent' ? 'Giảm (%)' : 'Giảm (VND)'}
          value={form.discountValue} onChange={f('discountValue')} type="number" required />
        <Input label="Đơn tối thiểu (VND, để trống = không giới hạn)"
          value={form.minOrderValue ?? ''} onChange={f('minOrderValue')} type="number" />
        <Input label="Số lượt dùng tối đa (để trống = không giới hạn)"
          value={form.maxUses ?? ''} onChange={f('maxUses')} type="number" />
        <Input label="Hết hạn" value={form.expiresAt ?? ''} onChange={f('expiresAt')} type="datetime-local" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
        <span className="text-gray-400 text-sm">Đang kích hoạt</span>
      </div>
      <div className="flex gap-3 pt-2">
        <Btn onClick={save}>Lưu</Btn>
        <Btn variant="ghost" onClick={() => { setEditing(null); setCreating(false) }}>Hủy</Btn>
      </div>
    </div>
  )

  if (loading) return <p className="text-gray-500 text-sm">Đang tải...</p>

  return (
    <>
      <div className="flex justify-end mb-4">
        <Btn onClick={() => { setForm(empty as unknown as Omit<Promotion, 'id' | 'usedCount' | 'createdAt'>); setCreating(true) }}>+ Thêm mã khuyến mại</Btn>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['Mã', 'Giảm giá', 'Đơn tối thiểu', 'Lượt dùng', 'Hết hạn', 'Trạng thái', ''].map(h => (
                <th key={h} className="text-left text-gray-500 font-medium py-3 px-3 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-600 py-8 text-sm">Chưa có mã khuyến mại nào</td></tr>
            )}
            {promos.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-3 px-3 text-yellow-400 font-mono font-semibold">{p.code}</td>
                <td className="py-3 px-3 text-white">
                  {p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString('vi-VN')}đ`}
                </td>
                <td className="py-3 px-3 text-gray-400">
                  {p.minOrderValue ? `${p.minOrderValue.toLocaleString('vi-VN')}đ` : '—'}
                </td>
                <td className="py-3 px-3 text-gray-400">
                  {p.usedCount}{p.maxUses ? `/${p.maxUses}` : ''}
                </td>
                <td className="py-3 px-3 text-gray-500 text-xs">
                  {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="py-3 px-3">
                  <span className={`text-xs px-2 py-1 rounded-lg border ${p.isActive ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                    {p.isActive ? 'Đang áp dụng' : 'Tắt'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex gap-2">
                    <Btn size="sm" variant="ghost" onClick={() => { setForm(p); setEditing(p) }}>Sửa</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(p.id)}>Xóa</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <Modal title={editing ? `Sửa: ${editing.code}` : 'Tạo mã khuyến mại'} onClose={() => { setEditing(null); setCreating(false) }}>
          {promoFormJsx}
        </Modal>
      )}
    </>
  )
}

// ─── Expiring Subscriptions Widget ──────────────────────────────────────────
interface ExpiringSub {
  userId: number
  name: string
  email: string
  phone?: string | null
  serviceName: string
  expiresAt: string
}

function ExpiringSubscriptionsWidget() {
  const [subs, setSubs] = useState<ExpiringSub[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    adminApi.getExpiringSubscriptions(7)
      .then(r => setSubs((r.data ?? r).slice(0, 10)))
      .finally(() => setLoading(false))
  }, [])

  const copy = (phone: string) => {
    navigator.clipboard.writeText(phone)
    setCopied(phone)
    setTimeout(() => setCopied(null), 2000)
  }

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  if (loading) return null

  return (
    <div className="mb-6 bg-amber-950/30 border border-amber-900/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-sm font-semibold">⏰ Sắp hết hạn (7 ngày)</span>
          {subs.length > 0 && (
            <span className="bg-amber-500/20 text-amber-400 border border-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {subs.length}
            </span>
          )}
        </div>
        <span className="text-gray-600 text-xs">{collapsed ? '▼ Mở' : '▲ Thu'}</span>
      </button>
      {!collapsed && (
        <div className="px-5 pb-4">
          {subs.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Không có subscription nào sắp hết hạn</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-900/30">
                    {['Tên', 'Email', 'Dịch vụ', 'Hết hạn', ''].map(h => (
                      <th key={h} className="text-left text-amber-700 font-medium py-2 px-2 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s, i) => {
                    const days = daysLeft(s.expiresAt)
                    return (
                      <tr key={i} className="border-b border-amber-900/20 hover:bg-amber-900/10">
                        <td className="py-2 px-2 text-white text-xs font-medium">{s.name}</td>
                        <td className="py-2 px-2 text-gray-400 text-xs">{s.email}</td>
                        <td className="py-2 px-2 text-amber-300 text-xs">{s.serviceName}</td>
                        <td className="py-2 px-2">
                          <span className={`text-xs font-medium ${days <= 1 ? 'text-red-400' : days <= 3 ? 'text-orange-400' : 'text-yellow-400'}`}>
                            {new Date(s.expiresAt).toLocaleDateString('vi-VN')}
                            <span className="ml-1 text-gray-600">({days}d)</span>
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          {s.phone && (
                            <button
                              onClick={() => copy(s.phone!)}
                              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg px-2 py-1 transition-colors"
                            >
                              {copied === s.phone ? '✓ Copied' : `📋 ${s.phone}`}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Dashboard')
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.replace('/admin/login')
    } else {
      setAuthed(true)
    }
  }, [router])

  const logout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (!authed) return null

  const TAB_COMPONENTS: Record<Tab, React.ReactNode> = {
    'Dashboard':   <AnalyticsTab />,
    'Đơn hàng':    <OrdersTab />,
    'Sản phẩm':    <ProductsTab />,
    'Thành viên':  <UsersTab />,
    'Hướng dẫn':   <GuidesTab />,
    'Cấu hình giá': <PricingRulesTab />,
    'Khuyến mại':  <PromotionsTab />,
    'Media':       <MediaTab />,
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-primary-400 font-bold text-lg">Miu Shop</span>
          <span className="text-gray-600 text-sm">/</span>
          <span className="text-gray-400 text-sm">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Xem website →
          </a>
          <button onClick={logout} className="text-gray-500 hover:text-red-400 text-sm transition-colors">
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <nav className="flex gap-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        <ExpiringSubscriptionsWidget />
        {TAB_COMPONENTS[tab]}
      </main>
    </div>
  )
}
