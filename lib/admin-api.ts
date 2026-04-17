const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? `Request failed: ${res.status}`)
  return json
}

export const adminApi = {
  login: (username: string, password: string) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  getProducts: () => apiFetch('/admin/products?limit=200'),

  setFlashSale: (id: number, salePrice: number, saleEndsAt: string) =>
    apiFetch(`/admin/products/${id}/flash-sale`, {
      method: 'POST',
      body: JSON.stringify({ salePrice, saleEndsAt }),
    }),

  clearFlashSale: (id: number) =>
    apiFetch(`/admin/products/${id}/flash-sale`, { method: 'DELETE' }),
}
