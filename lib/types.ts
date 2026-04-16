export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  stock: number
  category?: string
  groupKey?: string
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
