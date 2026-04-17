import { apiUrl } from './api'

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = getAdminToken()
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `Request failed: ${res.status}`)
  return json
}

export const adminApi = {
  // Auth
  login: (username: string, password: string) =>
    adminFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // Orders
  getOrders: () => adminFetch('/admin/orders'),
  updateOrderStatus: (id: number, status: string) =>
    adminFetch(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Products
  getProducts: () => adminFetch('/products?limit=500'),
  createProduct: (data: unknown) =>
    adminFetch('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: unknown) =>
    adminFetch(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) =>
    adminFetch(`/admin/products/${id}`, { method: 'DELETE' }),

  // Guides
  getGuides: () => adminFetch('/admin/guides'),
  createGuide: (data: unknown) =>
    adminFetch('/admin/guides', { method: 'POST', body: JSON.stringify(data) }),
  updateGuide: (id: number, data: unknown) =>
    adminFetch(`/admin/guides/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGuide: (id: number) =>
    adminFetch(`/admin/guides/${id}`, { method: 'DELETE' }),

  // Pricing rules
  getPricingRules: () => adminFetch('/admin/pricing-rules'),
  createPricingRule: (data: unknown) =>
    adminFetch('/admin/pricing-rules', { method: 'POST', body: JSON.stringify(data) }),
  updatePricingRule: (id: number, data: unknown) =>
    adminFetch(`/admin/pricing-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePricingRule: (id: number) =>
    adminFetch(`/admin/pricing-rules/${id}`, { method: 'DELETE' }),
  previewPrice: (productId: number) =>
    adminFetch(`/admin/pricing-rules/preview/${productId}`),

  // Promotions
  getPromotions: () => adminFetch('/admin/promotions'),
  createPromotion: (data: unknown) =>
    adminFetch('/admin/promotions', { method: 'POST', body: JSON.stringify(data) }),
  updatePromotion: (id: number, data: unknown) =>
    adminFetch(`/admin/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePromotion: (id: number) =>
    adminFetch(`/admin/promotions/${id}`, { method: 'DELETE' }),

  // Banners
  getBanners: () => adminFetch('/admin/banners'),
  createBanner: (data: unknown) =>
    adminFetch('/admin/banners', { method: 'POST', body: JSON.stringify(data) }),
  updateBanner: (id: number, data: unknown) =>
    adminFetch(`/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBanner: (id: number) =>
    adminFetch(`/admin/banners/${id}`, { method: 'DELETE' }),
}
