import { apiUrl } from './api'

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

export async function fetchMe(token: string) {
  const res = await fetch(apiUrl('/auth/user/me'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data as { id: number; email: string; name: string; avatar?: string }
}
