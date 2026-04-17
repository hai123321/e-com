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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await adminApi.login(username, password)
      localStorage.setItem('admin_token', token)
      router.push('/admin/flash-sale')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Du0103ng nhu1eadp thu1ea5t bu1ea1i')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-white mb-6">Admin Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Tu00ean u0111u0103ng nhu1eadp</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Mu1eadt khu1ea9u</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-primary-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            {loading ? 'u0110ang u0111u0103ng nhu1eadp...' : 'u0110u0103ng nhu1eadp'}
          </button>
        </form>
      </div>
    </div>
  )
}
