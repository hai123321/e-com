'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, Plus, Power, PowerOff, Trash2, LogOut } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'
import { formatCurrency } from '@/lib/utils'
import type { Promotion } from '@/lib/types'

const EMPTY_FORM = {
  code: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '',
  minOrderValue: '',
  maxUses: '',
  expiresAt: '',
}

export default function PromotionsAdminPage() {
  const router = useRouter()
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function logout() {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  async function load() {
    try {
      const json = await adminApi.getPromotions()
      setPromos(json.data ?? [])
    } catch {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      router.push('/admin/login')
      return
    }
    load()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adminApi.createPromotion({
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tạo thất bại')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: Promotion) {
    try {
      await adminApi.updatePromotion(p.id, { isActive: !p.isActive })
      load()
    } catch {}
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa mã giảm giá này?')) return
    try {
      await adminApi.deletePromotion(id)
      load()
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5 text-primary-600" />
          <h1 className="font-bold text-gray-900">Quản lý mã giảm giá</h1>
        </div>
        <div className="flex gap-3">
          <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700">u2190 Admin</a>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600">
            <LogOut className="w-4 h-4" /> Thoát
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo mã mới
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Tạo mã giảm giá</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mã (cód)</label>
                <input required className="input-field uppercase" value={form.code}
                  onChange={e => setForm({...form, code: e.target.value})} placeholder="SALE20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Loại giảm</label>
                <select className="input-field" value={form.discountType}
                  onChange={e => setForm({...form, discountType: e.target.value as 'percent' | 'fixed'})}>
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (đ)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Giá trị {form.discountType === 'percent' ? '(%)' : '(đ)'}
                </label>
                <input required type="number" min="1" className="input-field" value={form.discountValue}
                  onChange={e => setForm({...form, discountValue: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Đơn tối thiểu (đ)</label>
                <input type="number" min="0" className="input-field" value={form.minOrderValue}
                  onChange={e => setForm({...form, minOrderValue: e.target.value})}
                  placeholder="Để trống = không giới hạn" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Số lượt dùng tối đa</label>
                <input type="number" min="1" className="input-field" value={form.maxUses}
                  onChange={e => setForm({...form, maxUses: e.target.value})}
                  placeholder="Để trống = không giới hạn" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hết hạn</label>
                <input type="datetime-local" className="input-field" value={form.expiresAt}
                  onChange={e => setForm({...form, expiresAt: e.target.value})} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Hủy</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-semibold">
                {saving ? 'Đang lưu...' : 'Tạo mã'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Mã', 'Loại giảm', 'Giá trị', 'Đơn tối thiểu', 'Lượt dùng', 'Hết hạn', 'Trạng thái', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promos.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Chưa có mã nào</td></tr>
                )}
                {promos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{p.code}</td>
                    <td className="px-4 py-3 text-gray-600">{p.discountType === 'percent' ? 'Phần trăm' : 'Cố định'}</td>
                    <td className="px-4 py-3 font-semibold">
                      {p.discountType === 'percent' ? `${p.discountValue}%` : formatCurrency(p.discountValue)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.minOrderValue ? formatCurrency(p.minOrderValue) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(p)}
                          className="text-gray-400 hover:text-primary-600 transition-colors" title={p.isActive ? 'Tắt' : 'Bật'}>
                          {p.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
