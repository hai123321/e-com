import { apiUrl } from './api'

export interface UserNotification {
  id: number
  userId: number
  type: string
  title: string
  body: string
  isRead: boolean
  meta: Record<string, unknown>
  createdAt: string
}

export async function fetchNotifications(token: string): Promise<{ items: UserNotification[]; unread: number }> {
  const res = await fetch(apiUrl('/me/notifications'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return { items: [], unread: 0 }
  const data = await res.json()
  return data.data ?? { items: [], unread: 0 }
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await fetch(apiUrl('/me/notifications/read-all'), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function markNotificationRead(token: string, id: number): Promise<void> {
  await fetch(apiUrl(`/me/notifications/${id}/read`), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}
