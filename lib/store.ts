'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, CategoryFilter, Product, StockFilter, Toast, ToastType, UserSession } from './types'
import type { Locale } from './i18n'
import { getT } from './i18n'

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

  // Mini-cart
  isMiniCartOpen: boolean
  openMiniCart: () => void
  closeMiniCart: () => void

  // Promo
  promoCode: string | null
  promoDiscount: number
  applyPromo: (code: string, discount: number) => void
  clearPromo: () => void

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

  // User auth
  user: UserSession | null
  userToken: string | null
  sessionHydrated: boolean          // true once SessionHydrator has finished (success or not)
  setUser: (user: UserSession, token: string) => void
  clearUser: () => void
  setSessionHydrated: () => void
}

export const useStore = create<CartStore>()(
  persist(
    (set, get) => ({
  // ── Cart ──────────────────────────────────────────
  items: [],
  isCartOpen: false,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),

  addItem: (product) => {
    const { items, addToast, locale } = get()
    const msgs = getT(locale).storeMsg
    if (product.stock <= 0) {
      addToast(msgs.outOfStock, 'error')
      return
    }
    const existing = items.find((i) => i.product.id === product.id)
    if (existing) {
      if (existing.qty >= product.stock) {
        addToast(msgs.maxQty, 'error')
        return
      }
      set({ items: items.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i) })
    } else {
      set({ items: [...items, { product, qty: 1 }] })
    }
    addToast(msgs.added(product.name), 'success')
  },

  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),

  updateQty: (productId, delta) => {
    const { items, addToast, locale } = get()
    const msgs = getT(locale).storeMsg
    const item = items.find((i) => i.product.id === productId)
    if (!item) return
    const next = item.qty + delta
    if (next <= 0) {
      set({ items: items.filter((i) => i.product.id !== productId) })
      return
    }
    if (next > item.product.stock) {
      addToast(msgs.exceedsStock, 'error')
      return
    }
    set({ items: items.map((i) => i.product.id === productId ? { ...i, qty: next } : i) })
  },

  clearCart: () => {
    const msgs = getT(get().locale).storeMsg
    set({ items: [], promoCode: null, promoDiscount: 0 })
    get().addToast(msgs.cartCleared, 'info')
  },

  totalItems: () => get().items.reduce((s, i) => s + i.qty, 0),
  totalPrice: () => get().items.reduce((s, i) => s + i.product.price * i.qty, 0),

  // ── Mini-cart ─────────────────────────────────
  isMiniCartOpen: false,
  openMiniCart: () => set({ isMiniCartOpen: true }),
  closeMiniCart: () => set({ isMiniCartOpen: false }),

  // ── Promo ──────────────────────────────────────
  promoCode: null,
  promoDiscount: 0,
  applyPromo: (code, discount) => set({ promoCode: code, promoDiscount: discount }),
  clearPromo: () => set({ promoCode: null, promoDiscount: 0 }),

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

  // ── User auth ─────────────────────────────────────
  user: null,
  userToken: null,
  sessionHydrated: false,
  setUser: (user, token) => {
    set({ user, userToken: token })
    if (typeof window !== 'undefined') localStorage.setItem('user_token', token)
  },
  clearUser: () => {
    set({ user: null, userToken: null })
    if (typeof window !== 'undefined') localStorage.removeItem('user_token')
  },
  setSessionHydrated: () => set({ sessionHydrated: true }),
    }),
    {
      name: 'miu-cart',
      partialize: (s) => ({ items: s.items, promoCode: s.promoCode, promoDiscount: s.promoDiscount }),
    },
  ),
)
