import { apiUrl } from './api'

export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionSource = 'manual' | 'miushop'

export interface Subscription {
  id: number
  serviceName: string
  logoUrl: string | null
  monthlyPrice: number
  billingCycle: BillingCycle
  expiresAt: string | null
  source: SubscriptionSource
  miuSuggestedProductId: number | null
  savingsPercent: number | null
  isActive: boolean
  createdAt: string
}

export interface SubscriptionSummaryData {
  totalMonthly: number
  totalYearly: number
  count: number
  expiringSoon: Subscription[]
}

export interface CreateSubscriptionInput {
  serviceName: string
  monthlyPrice: number
  billingCycle: BillingCycle
  expiresAt?: string | null
  logoUrl?: string | null
}

export interface UpdateSubscriptionInput {
  serviceName?: string
  monthlyPrice?: number
  billingCycle?: BillingCycle
  expiresAt?: string | null
}

export async function fetchSubscriptions(token: string): Promise<Subscription[]> {
  const res = await fetch(apiUrl('/me/subscriptions'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  const json = await res.json()
  return json.data as Subscription[]
}

export async function fetchSubscriptionSummary(token: string): Promise<SubscriptionSummaryData | null> {
  const res = await fetch(apiUrl('/me/subscriptions/summary'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data as SubscriptionSummaryData
}

export async function createSubscription(
  token: string,
  data: CreateSubscriptionInput,
): Promise<Subscription> {
  const res = await fetch(apiUrl('/me/subscriptions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Thêm gói thất bại')
  return json.data as Subscription
}

export async function updateSubscription(
  token: string,
  id: number,
  data: UpdateSubscriptionInput,
): Promise<Subscription> {
  const res = await fetch(apiUrl(`/me/subscriptions/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Cập nhật thất bại')
  return json.data as Subscription
}

export async function deleteSubscription(token: string, id: number): Promise<void> {
  const res = await fetch(apiUrl(`/me/subscriptions/${id}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { error?: string }).error ?? 'Xóa thất bại')
  }
}

export async function importFromOrders(token: string): Promise<{ imported: number }> {
  const res = await fetch(apiUrl('/me/subscriptions/import-orders'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Import thất bại')
  return json.data as { imported: number }
}
