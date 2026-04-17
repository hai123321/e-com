'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, X, Check, LogOut } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  isActive: boolean
  salePrice?: number | null
  saleEndsAt?: string | null
}

function isFlashSaleActive(p: Product): boolean {
  return !!(
    p.salePrice &&
    p.saleEndsAt &&
    new Date(p.saleEndsAt) > new Date()
  )
}

export default function FlashSaleAdminPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [salePrice, setSalePrice] = useState('')
  const [saleEndsAt, setSaleEndsAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function logout() {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  async function load() {
    try {
      const json = await adminApi.getProducts()
      setProducts(json.data ?? [])
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

  function startEdit(p: Product) {
    setEditing(p.id)
    setSalePrice(p.salePrice ? String(p.salePrice) : '')
    const defaultEnd = new Date(Date.now() + 24 * 60 * 60 * 1000)
    setSaleEndsAt(p.saleEndsAt
      ? new Date(p.saleEndsAt).toISOString().slice(0, 16)
      : defaultEnd.toISOString().slice(0, 16)
    )
    setError('')
  }

  async function handleSet(id: number) {
    const price = parseInt(salePrice)
    if (isNaN(price) || price <= 0) { setError('Giu00e1 sale phu1ea3i lu00e0 su1ed1 du01b0u01a1ng'); return }
    if (!saleEndsAt) { setError('Chu1ecdn thu1eddi gian ku1ebft thu00fac'); return }
    setSaving(true)
    setError('')
    try {
      await adminApi.setFlashSale(id, price, new Date(saleEndsAt).toISOString())
      await load()
      setEditing(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lu1ed7i khu00f4ng xu00e1c u0111u1ecbnh')
    } finally {
      setSaving(false)
    }
  }

  async function handleClear(id: number) {
    setSaving(true)
    try {
      await adminApi.clearFlashSale(id)
      await load()
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-400 fill-current" />
            <h1 className="text-xl font-bold text-white">Quu1ea3n lu00fd Flash Sale</h1>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            u0110u0103ng xuu1ea5t
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">Su1ea3n phu1ea9m</th>
                <th className="text-right text-gray-400 text-xs font-medium px-6 py-4">Giu00e1 gu1ed1c</th>
                <th className="text-center text-gray-400 text-xs font-medium px-6 py-4">Flash Sale</th>
                <th className="text-right text-gray-400 text-xs font-medium px-6 py-4">Thao tu00e1c</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const onSale = isFlashSaleActive(p)
                const isEditingThis = editing === p.id

                return (
                  <tr key={p.id} className="border-b border-gray-800/60 last:border-0">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium text-sm">{p.name}</div>
                      <div className="text-gray-500 text-xs">Kho: {p.stock}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300 text-sm">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {onSale ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-400 border border-red-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                            <Zap className="w-3 h-3 fill-current" />
                            {formatCurrency(p.salePrice!)}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(p.saleEndsAt!).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">Khu00f4ng</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditingThis ? (
                        <div className="flex flex-col gap-2 items-end">
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              placeholder="Giu00e1 sale (VND)"
                              value={salePrice}
                              onChange={(e) => setSalePrice(e.target.value)}
                              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm w-36 outline-none focus:border-primary-500"
                            />
                            <input
                              type="datetime-local"
                              value={saleEndsAt}
                              onChange={(e) => setSaleEndsAt(e.target.value)}
                              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-primary-500"
                            />
                          </div>
                          {error && <p className="text-red-400 text-xs">{error}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSet(p.id)}
                              disabled={saving}
                              className="flex items-center gap-1.5 bg-green-900/50 hover:bg-green-800 text-green-400 border border-green-800 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Lu01b0u
                            </button>
                            {onSale && (
                              <button
                                onClick={() => handleClear(p.id)}
                                disabled={saving}
                                className="flex items-center gap-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 border border-red-800 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                Xu00f3a sale
                              </button>
                            )}
                            <button
                              onClick={() => setEditing(null)}
                              className="text-gray-500 hover:text-gray-300 text-xs px-2 transition-colors"
                            >
                              Hu1ee7y
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="flex items-center gap-1.5 bg-amber-900/40 hover:bg-amber-900/70 text-amber-400 border border-amber-800 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            {onSale ? 'Su1eeda sale' : 'Bu1eadt sale'}
                          </button>
                          {onSale && (
                            <button
                              onClick={() => handleClear(p.id)}
                              disabled={saving}
                              className="flex items-center gap-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 border border-red-800 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Tu1eaft
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
