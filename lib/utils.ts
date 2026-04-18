import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Product, StockStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return 'out'
  if (stock <= 5) return 'low'
  if (stock <= 10) return 'medium'
  return 'high'
}

export function getStockLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    high: 'Còn hàng',
    medium: 'Còn ít',
    low: 'Sắp hết',
    out: 'Hết hàng',
  }
  return labels[status]
}

export function filterProducts(
  products: Product[],
  query: string,
  stockFilter: string,
  categoryFilter: string = 'all',
): Product[] {
  const q = query.toLowerCase().trim()
  return products.filter((p) => {
    const matchSearch =
      !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    const status = getStockStatus(p.stock)
    const matchStock =
      stockFilter === 'all' ||
      (stockFilter === 'high' && status === 'high') ||
      (stockFilter === 'medium' && status === 'medium') ||
      (stockFilter === 'low' && (status === 'low' || status === 'out'))
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchSearch && matchStock && matchCategory
  })
}
