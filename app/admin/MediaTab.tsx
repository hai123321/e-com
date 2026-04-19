'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, ImageIcon, LayoutTemplate, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'
import { CropModal } from '@/components/ui/CropModal'

// ─── Shared UI (mirrors admin/page.tsx) ────────────────────────────────────────
const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void
  variant?: 'primary' | 'danger' | 'ghost' | 'success'
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
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]}`}>{children}</button>
}

const Input = ({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string | number; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean
}) => (
  <div>
    <label className="text-gray-400 text-xs font-medium mb-1 block">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
  </div>
)

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
    onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h2 className="text-white font-semibold">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

// ─── Types ────────────────────────────────────────────────────────────────────
interface LogoEntry {
  key: string
  domain: string
  hasLocal: boolean
  url: string
}

interface Banner {
  id: number; title: string; subtitle: string; image: string
  href: string; priority: number; isActive: boolean
}

// ─── Logo Section ─────────────────────────────────────────────────────────────
const LOGO_OUT = 400   // 400×400 JPEG output

function LogoSection() {
  const [logos, setLogos]   = useState<LogoEntry[]>([])
  const [total, setTotal]   = useState(0)
  const [local, setLocal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'local' | 'clearbit'>('all')

  const [cropSrc, setCropSrc]     = useState<string | null>(null)
  const [cropKey, setCropKey]     = useState('')
  const [saving, setSaving]       = useState(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)
  const pendingKey                = useRef('')

  const load = useCallback(() => {
    setLoading(true)
    const token = localStorage.getItem('admin_token') ?? ''
    fetch('/api/admin/media', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setLogos(json.data.logos)
          setTotal(json.data.total)
          setLocal(json.data.local)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const triggerUpload = (key: string) => {
    pendingKey.current = key
    fileInputRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setCropSrc(ev.target?.result as string)
      setCropKey(pendingKey.current)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleConfirm = async (dataUrl: string) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('admin_token') ?? ''
      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupKey: cropKey, imageData: dataUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload thất bại')
      const ts = Date.now()
      setLogos(prev => prev.map(l =>
        l.key === cropKey ? { ...l, hasLocal: true, url: `/api/logos/${cropKey}.jpg?t=${ts}` } : l
      ))
      setLocal(prev => prev + (logos.find(l => l.key === cropKey)?.hasLocal ? 0 : 1))
      setCropSrc(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi upload')
    } finally {
      setSaving(false)
    }
  }

  const displayed = logos.filter(l => {
    const matchSearch = !search || l.key.includes(search.toLowerCase()) || l.domain.includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'local' ? l.hasLocal : !l.hasLocal)
    return matchSearch && matchFilter
  })

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-800 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-semibold">{loading ? '…' : local}</span>
          <span className="text-green-600 text-xs">local</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-800 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm font-semibold">{loading ? '…' : total - local}</span>
          <span className="text-yellow-600 text-xs">clearbit</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
          <span className="text-gray-400 text-sm">{loading ? '…' : total}</span>
          <span className="text-gray-600 text-xs">tổng logo</span>
        </div>
        <button onClick={load} className="ml-auto p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Tải lại">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm logo…"
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
        />
        {(['all', 'local', 'clearbit'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              filter === f
                ? 'bg-primary-700 border-primary-600 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}>
            {f === 'all' ? 'Tất cả' : f === 'local' ? '✓ Local' : '↗ Clearbit'}
          </button>
        ))}
      </div>

      {/* ── Logo grid ── */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Đang tải…</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {displayed.map(logo => (
            <div key={logo.key} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden group hover:border-gray-500 transition-colors">
              {/* Logo image */}
              <div className="aspect-square relative bg-gray-900">
                <Image
                  src={logo.url}
                  alt={logo.key}
                  fill
                  unoptimized
                  className="object-contain p-3"
                  sizes="160px"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {/* Status badge */}
                <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${logo.hasLocal ? 'bg-green-400' : 'bg-yellow-400'}`}
                  title={logo.hasLocal ? 'Lưu local' : 'Dùng Clearbit CDN'} />
              </div>
              {/* Info + action */}
              <div className="p-2">
                <p className="text-white text-xs font-mono truncate mb-0.5">{logo.key}</p>
                <p className="text-gray-600 text-[10px] truncate mb-2">{logo.domain}</p>
                <button
                  onClick={() => triggerUpload(logo.key)}
                  className="w-full flex items-center justify-center gap-1 bg-gray-700 hover:bg-primary-700 text-gray-300 hover:text-white text-xs font-medium rounded-lg py-1.5 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Thay ảnh
                </button>
              </div>
            </div>
          ))}
          {displayed.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-600 text-sm">
              Không tìm thấy logo nào
            </div>
          )}
        </div>
      )}

      {/* Crop modal */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          title={`Cắt logo — ${cropKey} (1:1 vuông)`}
          aspectRatio={1}
          outputWidth={LOGO_OUT}
          outputHeight={LOGO_OUT}
          onConfirm={handleConfirm}
          onClose={() => setCropSrc(null)}
        />
      )}

      {saving && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl px-8 py-6 text-white text-sm font-semibold">
            Đang lưu ảnh…
          </div>
        </div>
      )}
    </>
  )
}

// ─── Banner Section ───────────────────────────────────────────────────────────
const BANNER_W     = 1280
const BANNER_H     = 720
const BANNER_RATIO = BANNER_W / BANNER_H   // 16:9

function BannerSection() {
  const [banners, setBanners]   = useState<Banner[]>([])
  const [creating, setCreating] = useState(false)
  const [editing, setEditing]   = useState<Banner | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  const [cropSrc, setCropSrc]         = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const empty: Omit<Banner, 'id'> = { title: '', subtitle: '', image: '', href: '/#products', priority: 0, isActive: true }
  const [form, setForm] = useState<Omit<Banner, 'id'>>(empty)
  const bannerIdForUpload = editing?.id ?? `new-${Date.now()}`

  useEffect(() => {
    adminApi.getBanners().then(r => { setBanners(r.data ?? []); setLoading(false) })
  }, [])

  const openForm = (banner?: Banner) => {
    setForm(banner ?? empty)
    if (banner) setEditing(banner)
    else setCreating(true)
  }
  const closeForm = () => { setEditing(null); setCreating(false); setCropSrc(null) }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        const r = await adminApi.updateBanner(editing.id, form)
        setBanners(prev => prev.map(b => b.id === editing.id ? r.data : b))
      } else {
        const r = await adminApi.createBanner(form)
        setBanners(prev => [r.data, ...prev])
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: number) => {
    if (!confirm('Xóa banner này?')) return
    await adminApi.deleteBanner(id)
    setBanners(prev => prev.filter(b => b.id !== id))
  }

  const f = (key: keyof typeof form) => (v: string) =>
    setForm(prev => ({ ...prev, [key]: key === 'priority' ? parseInt(v) || 0 : v }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropConfirm = async (dataUrl: string) => {
    setUploadingImg(true)
    setCropSrc(null)
    try {
      const token = localStorage.getItem('admin_token') ?? ''
      const res   = await fetch('/api/upload-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bannerId: bannerIdForUpload, imageData: dataUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload thất bại')
      setForm(prev => ({ ...prev, image: json.data.path }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi upload ảnh')
    } finally {
      setUploadingImg(false)
    }
  }

  const bannerFormJsx = (
    <div className="space-y-5">
      {/* ── Banner image upload ── */}
      <div>
        <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
          Ảnh banner <span className="text-gray-600 normal-case">({BANNER_W}×{BANNER_H} px · 16:9)</span>
        </p>
        <div className="relative w-full rounded-xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 group"
          style={{ paddingTop: `${(1 / BANNER_RATIO) * 100}%` }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {form.image ? (
              <>
                <Image src={form.image} alt="banner preview" fill unoptimized className="object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                    Thay ảnh
                  </button>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImg}
                className="flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors">
                {uploadingImg ? (
                  <div className="w-8 h-8 border-4 border-gray-600 border-t-primary-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Click để chọn ảnh banner</span>
                    <span className="text-xs text-gray-600">JPG, PNG, WebP · Tối đa 10MB</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {form.image && (
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-gray-600 font-mono truncate max-w-xs">{form.image}</span>
            <button type="button" onClick={() => setForm(p => ({ ...p, image: '' }))}
              className="text-xs text-red-500 hover:text-red-400 ml-2 shrink-0">
              Xóa ảnh
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Tiêu đề" value={form.title} onChange={f('title')} required />
        <Input label="Phụ đề" value={form.subtitle} onChange={f('subtitle')} placeholder="Mô tả ngắn" />
        <Input label="Liên kết (href)" value={form.href} onChange={f('href')} placeholder="/san-pham/netflix" />
        <Input label="Độ ưu tiên (số lớn hiển thị trước)" value={form.priority} onChange={f('priority')} type="number" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="bannerIsActive" checked={form.isActive}
          onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
        <label htmlFor="bannerIsActive" className="text-gray-400 text-sm">Đang hiển thị</label>
      </div>

      <div className="flex gap-3 pt-2">
        <Btn onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Btn>
        <Btn variant="ghost" onClick={closeForm}>Hủy</Btn>
      </div>

      {cropSrc && (
        <CropModal
          src={cropSrc}
          title="Cắt ảnh banner (16:9)"
          aspectRatio={BANNER_RATIO}
          outputWidth={BANNER_W}
          outputHeight={BANNER_H}
          onConfirm={handleCropConfirm}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  )

  if (loading) return <p className="text-gray-500 text-sm">Đang tải…</p>

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-xs">
          {banners.length} banner · {BANNER_W}×{BANNER_H} px · 16:9
        </p>
        <Btn onClick={() => openForm()}>+ Thêm banner</Btn>
      </div>

      <div className="space-y-3 mb-6">
        {banners.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-8">Chưa có banner nào</p>
        )}
        {banners.map(b => (
          <div key={b.id} className="flex items-center gap-4 bg-gray-800/50 border border-gray-700 rounded-xl p-3">
            <div className="relative shrink-0 w-40 rounded-lg overflow-hidden bg-gray-900 border border-gray-700"
              style={{ aspectRatio: `${BANNER_RATIO}` }}>
              {b.image
                ? <Image src={b.image} alt={b.title} fill unoptimized className="object-cover" />
                : <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs">No image</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{b.title || '—'}</p>
              <p className="text-gray-500 text-xs truncate mt-0.5">{b.subtitle || '—'}</p>
              <p className="text-gray-600 text-xs font-mono truncate mt-0.5">{b.href}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-lg border ${b.isActive ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                {b.isActive ? 'Hiển thị' : 'Ẩn'}
              </span>
              <span className="text-gray-600 text-xs">Ưu tiên: {b.priority}</span>
              <div className="flex gap-2 mt-1">
                <Btn size="sm" variant="ghost" onClick={() => openForm(b)}>Sửa</Btn>
                <Btn size="sm" variant="danger" onClick={() => del(b.id)}>Xóa</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <Modal title={editing ? `Sửa: ${editing.title}` : 'Thêm banner mới'} onClose={closeForm}>
          {bannerFormJsx}
        </Modal>
      )}
    </>
  )
}

// ─── Media Tab (exported) ─────────────────────────────────────────────────────
type Section = 'logos' | 'banners'

const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: 'logos',   label: 'Logo sản phẩm', icon: ImageIcon },
  { key: 'banners', label: 'Banner',         icon: LayoutTemplate },
]

export function MediaTab() {
  const [section, setSection] = useState<Section>('logos')

  return (
    <div>
      {/* ── Section tabs ── */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              section === key
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {section === 'logos'   && <LogoSection />}
      {section === 'banners' && <BannerSection />}
    </div>
  )
}
