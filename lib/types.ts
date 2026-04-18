export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  stock: number
  category?: string
  groupKey?: string
  featuredPriority?: number
  salePrice?: number | null
  saleEndsAt?: string | null
  soldCount?: number
}

export interface CartItem {
  product: Product
  qty: number
}

export type StockStatus = 'high' | 'medium' | 'low' | 'out'
export type StockFilter = 'all' | 'high' | 'medium' | 'low'
export type CategoryFilter = 'all' | 'AI' | 'Streaming' | 'Học tập' | 'Thiết kế' | 'VPN' | 'Năng suất' | 'Lưu trữ' | 'Khác'
export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

export interface UserSession {
  id: number
  email: string
  name: string
  avatar?: string | null
}

export interface PricingRule {
  id: number
  name: string
  description: string
  ruleType: 'multiplier' | 'fixed_add' | 'stock_based' | 'time_based' | 'manual_override'
  params: Record<string, unknown>
  scopeType: 'global' | 'category' | 'product'
  scopeValue?: string | null
  priority: number
  isActive: boolean
  startsAt?: string | null
  endsAt?: string | null
}

export interface Promotion {
  id: number
  code: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  minOrderValue?: number | null
  maxUses?: number | null
  usedCount: number
  isActive: boolean
  expiresAt?: string | null
  createdAt: string
}
