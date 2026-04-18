'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Check, Trash2, LogOut, Search } from 'lucide-react'

type Review = {
  id: string
  userId: string
  productId: string
  rating: number
  comment: string
  isApproved: boolean
  createdAt: string
  user: { id: string; name: string; avatarUrl?: string }
}

type StatusFilter = 'all' | 'pending' | 'approved'

const TAB_LABELS: Record<StatusFilter, string> = {
  all: 'Tất cả',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
}

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('admin_token') ?? ''
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  function logout() {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filter !== 'all') params.set('status', filter)
      if (query) params.set('q', query)
      const res = await fetch(`/api/admin/reviews?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login')
        return
      }
      const json = await res.json()
      setReviews(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [filter, query, page, router])

  useEffect(() => {
    if (!getToken()) {
      router.push('/admin/login')
      return
    }
    load()
  }, [load, router])

  async function handleApprove(id: string) {
    await fetch(`/api/admin/reviews/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa review này?')) return
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    load()
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-amber-500" />
          <h1 className="font-bold text-gray-900">Kiểm duyệt đánh giá</h1>
        </div>
        <div className="flex gap-3">
          <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</a>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600">
            <LogOut className="w-4 h-4" /> Thoát
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {(Object.keys(TAB_LABELS) as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => { setFilter(s); setPage(1) }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === s
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {TAB_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="Tìm theo sản phẩm..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Sản phẩm', 'Người dùng', 'Rating', 'Comment', 'Trạng thái', 'Ngày', 'Hành động'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      Không có đánh giá nào
                    </td>
                  </tr>
                )}
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[140px] truncate">
                      {r.productId}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.user.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < r.rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
                        ))}
                        <span className="ml-1 text-xs text-gray-400">{r.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                      <span className="line-clamp-2">{r.comment.slice(0, 100)}{r.comment.length > 100 ? '…' : ''}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {r.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!r.isApproved && (
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="Duyệt"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Xóa"
                        >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{total} đánh giá</span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="px-3 py-1.5">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
