'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/admin-api'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await adminApi.login(username, password)
      localStorage.setItem('admin_token', res.data.token)
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sai tu00e0i khou1ea3n hou1eb7c mu1eadt khu1ea9u')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h1 className="text-white text-xl font-bold mb-6 text-center">Miu Shop Admin</h1>
        {error && <p className="bg-red-900/40 text-red-400 border border-red-800 rounded-xl px-4 py-2.5 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Tu00ean u0111u0103ng nhu1eadp</label>
            <input
              required value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Mu1eadt khu1ea9u</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="u2022u2022u2022u2022u2022u2022u2022u2022"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-primary-700 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            {loading ? 'u0110ang u0111u0103ng nhu1eadp...' : 'u0110u0103ng nhu1eadp'}
          </button>
        </form>
      </div>
    </main>
  )
}
