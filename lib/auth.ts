import { apiUrl } from './api'

export type UserProfile = { id: number; email: string; name: string; avatar?: string | null }
export type OrderItem   = { id: number; productName: string; productPrice: number; quantity: number }
export type UserOrder   = {
  id: number; customerName: string; customerEmail: string | null
  status: string; total: number; note: string | null
  createdAt: string; items: OrderItem[]
}

export function getGoogleLoginUrl(): string {
  return apiUrl('/auth/google')
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(apiUrl('/auth/user/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Đăng nhập thất bại')
  return json.data as { token: string; user: { id: number; email: string; name: string; avatar?: string } }
}

export async function registerUser(email: string, password: string, name: string) {
  const res = await fetch(apiUrl('/auth/user/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Đăng ký thất bại')
  return json.data as { token: string; user: { id: number; email: string; name: string; avatar?: string } }
}

export async function fetchMe(token: string): Promise<UserProfile | null> {
  const res = await fetch(apiUrl('/auth/user/me'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data as UserProfile
}

export async function updateProfile(
  token: string,
  data: { name?: string; avatar?: string | null },
): Promise<UserProfile | null> {
  const res = await fetch(apiUrl('/auth/user/profile'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Cập nhật thất bại')
  return json.data as UserProfile
}

export async function fetchMyOrders(token: string): Promise<UserOrder[]> {
  const res = await fetch(apiUrl('/auth/user/orders'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  const json = await res.json()
  return json.data as UserOrder[]
}
