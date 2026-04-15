'use client'

import { create } from 'zustand'
import type { CartItem, CategoryFilter, Product, StockFilter, Toast, ToastType } from './types'
import type { Locale } from './i18n'

interface CartStore {
  // Cart
  items: CartItem[]
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, delta: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number

  // Filters
  searchQuery: string
  stockFilter: StockFilter
  categoryFilter: CategoryFilter
  setSearchQuery: (q: string) => void
  setStockFilter: (f: StockFilter) => void
  setCategoryFilter: (f: CategoryFilter) => void

  // Locale
  locale: Locale
  setLocale: (l: Locale) => void

  // Toasts
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

export const useStore = create<CartStore>((set, get) => ({
  // ── Cart ──────────────────────────────────────────
  items: [],
  isCartOpen: false,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),

  addItem: (product) => {
    const { items, addToast } = get()
    if (product.stock <= 0) {
      addToast('Sản phẩm đã hết hàng!', 'error')
      return
    }
    const existing = items.find((i) => i.product.id === product.id)
    if (existing) {
      if (existing.qty >= product.stock) {
        addToast('Đã đạt số lượng tồn kho tối đa!', 'error')
        return
      }
      set({ items: items.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i) })
    } else {
      set({ items: [...items, { product, qty: 1 }] })
    }
    addToast(`Đã thêm "${product.name}" vào giỏ hàng`, 'success')
  },

  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),

  updateQty: (productId, delta) => {
    const { items, addToast } = get()
    const item = items.find((i) => i.product.id === productId)
    if (!item) return
    const next = item.qty + delta
    if (next <= 0) {
      set({ items: items.filter((i) => i.product.id !== productId) })
      return
    }
    if (next > item.product.stock) {
      addToast('Vượt quá số lượng tồn kho!', 'error')
      return
    }
    set({ items: items.map((i) => i.product.id === productId ? { ...i, qty: next } : i) })
  },

  clearCart: () => {
    set({ items: [] })
    get().addToast('Đã xóa toàn bộ giỏ hàng', 'info')
  },

  totalItems: () => get().items.reduce((s, i) => s + i.qty, 0),
  totalPrice: () => get().items.reduce((s, i) => s + i.product.price * i.qty, 0),

  // ── Filters ───────────────────────────────────────
  searchQuery: '',
  stockFilter: 'all',
  categoryFilter: 'all',
  setSearchQuery: (q) => set({ searchQuery: q }),
  setStockFilter: (f) => set({ stockFilter: f }),
  setCategoryFilter: (f) => set({ categoryFilter: f }),

  // ── Locale ────────────────────────────────────────
  locale: 'vi',
  setLocale: (l) => set({ locale: l }),

  // ── Toasts ────────────────────────────────────────
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), 3500)
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
