'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'

export function useCart() {
  const items = useStore((s) => s.items)
  const promoCode = useStore((s) => s.promoCode)
  const promoDiscount = useStore((s) => s.promoDiscount)
  const addItem = useStore((s) => s.addItem)
  const removeItem = useStore((s) => s.removeItem)
  const updateQty = useStore((s) => s.updateQty)
  const clearCart = useStore((s) => s.clearCart)
  const applyPromo = useStore((s) => s.applyPromo)
  const clearPromo = useStore((s) => s.clearPromo)
  const totalItems = useStore((s) => s.totalItems)
  const totalPrice = useStore((s) => s.totalPrice)

  const subtotal = totalPrice()
  const itemCount = totalItems()

  const discountAmount =
    promoDiscount > 0
      ? promoDiscount <= 1
        ? subtotal * promoDiscount
        : promoDiscount
      : 0

  const grandTotal = Math.max(0, subtotal - discountAmount)

  return {
    items,
    itemCount,
    subtotal,
    discountAmount,
    grandTotal,
    promoCode,
    promoDiscount,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    applyPromo,
    clearPromo,
  }
}
