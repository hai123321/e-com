'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Box, TrendingUp } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/hooks/useT'
import { StockBadge } from '@/components/ui/Badge'
import { FlashSaleBadge } from '@/components/product/FlashSaleBadge'
import { Countdown } from '@/components/ui/Countdown'
import { StarRating } from '@/components/review/StarRating'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import { getServiceConfig } from '@/lib/service-config'
import { ProductPickerModal } from '@/components/product/ProductPickerModal'

interface Props {
  product: Product
}

function isFlashSaleActive(product: Product): boolean {
  return !!(
    product.salePrice &&
    product.saleEndsAt &&
    new Date(product.saleEndsAt) > new Date()
  )
}

export function ProductCard({ product }: Props) {
  const { addItem, items } = useStore()
  const t = useT()
  const status = getStockStatus(product.stock)
  const isOut = status === 'out'
  const inCart = items.find((i) => i.product.id === product.id)
  const svc = getServiceConfig(product.name, product.category)
  const detailHref = product.groupKey ? `/san-pham/${product.groupKey}` : null
  const [imgError, setImgError] = React.useState(false)
  const [isAdding, setIsAdding] = React.useState(false)
  const [cartAnimKey, setCartAnimKey] = React.useState(0)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const onSale = isFlashSaleActive(product)

  const showImage = product.image && !imgError
  const soldCount = product.soldCount ?? 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isOut) return
    // Grouped product → show picker so user selects the right variant
    if (product.groupKey) {
      setPickerOpen(true)
      return
    }
    if (isAdding) return
    addItem(product)
    setIsAdding(true)
    setCartAnimKey((k) => k + 1)
    setTimeout(() => setIsAdding(false), 500)
  }

  const cardContent = (
    <>
      {/* Image / branded fallback */}
      <div className="relative h-28 sm:h-36 overflow-hidden bg-white">
        <div className={`w-full h-full bg-gradient-to-br ${svc.bg} flex flex-col items-center justify-center gap-1 group-hover:scale-105 transition-transform duration-500`}>
          {showImage ? (
            <Image
              src={product.image!}
              alt={product.name}
              width={80}
              height={80}
              unoptimized
              className="object-contain w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-white/10 p-1.5"
              onError={() => setImgError(true)}
            />
          ) : (
            <>
              <span className="text-3xl sm:text-4xl select-none">{svc.icon}</span>
              <span className="text-white/60 text-[10px] font-medium uppercase tracking-wider hidden sm:block">
                {product.category ?? 'Premium'}
              </span>
            </>
          )}
        </div>

        {/* Flash sale badge */}
        {onSale && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white z-10 animate-pulse">
            ⚡ FLASH
          </span>
        )}
        {/* HOT / NEW badge */}
        {!onSale && product.stock <= 5 && status !== 'out' && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white z-10">
            🔥 Hot
          </span>
        )}
        {!onSale && product.stock > 50 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white z-10">
            {t.card.newBadge}
          </span>
        )}

        <div className="absolute top-2 right-2">
          <StockBadge status={status} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider mb-0.5">
          {t.card.label}
        </span>
        <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug mb-1 line-clamp-2">
          {product.name}
        </h3>
        {(product.reviewCount ?? 0) > 0 && (
          <div className="hidden sm:flex items-center gap-1 mb-1">
            <StarRating value={product.avgRating ?? 0} size="sm" />
            <span className="text-xs text-gray-400">({product.reviewCount})</span>
          </div>
        )}
        {/* Description — max 1 line, click card to read more */}
        <p className="hidden sm:block text-xs text-gray-400 leading-relaxed line-clamp-1 mb-2">
          {product.description}
        </p>

        {/* Price + CTA — mobile: inline row / desktop: stacked */}
        <div className="mt-auto pt-2">
          {/* Price row */}
          <div className="flex items-end justify-between sm:block mb-0 sm:mb-3">
            {onSale ? (
              <FlashSaleBadge
                originalPrice={product.price}
                salePrice={product.salePrice!}
                saleEndsAt={product.saleEndsAt!}
                compact
              />
            ) : (
              <div>
                <div className="text-sm sm:text-xl font-extrabold text-primary-700 leading-tight">
                  {product.groupKey && (
                    <span className="text-[10px] sm:text-xs text-gray-400 mr-0.5">{t.card.from}</span>
                  )}
                  {formatCurrency(product.price)}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400">{t.card.unit}</div>
              </div>
            )}

            {/* Mobile button — icon only */}
            <button
              onClick={handleAddToCart}
              disabled={isOut || isAdding}
              className="sm:hidden flex items-center justify-center gap-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-[10px] font-bold rounded-lg px-2 py-2 transition-all disabled:cursor-not-allowed shrink-0"
            >
              <ShoppingCart
                key={cartAnimKey}
                className={`w-3 h-3 ${isAdding ? 'animate-cart-bounce' : ''}`}
              />
              <span>{isOut ? '—' : inCart ? `+${inCart.qty}` : t.card.inCart}</span>
            </button>
          </div>

          {/* Desktop button — full width */}
          <button
            onClick={handleAddToCart}
            disabled={isOut || isAdding}
            className="hidden sm:flex w-full items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl py-2.5 transition-all hover:shadow-lg hover:shadow-primary-200 disabled:cursor-not-allowed"
          >
            <ShoppingCart
              key={cartAnimKey}
              className={`w-3.5 h-3.5 ${isAdding ? 'animate-cart-bounce' : ''}`}
            />
            {isOut ? t.card.outOfStock ?? '—' : inCart ? `${t.card.inCart} (${inCart.qty})` : t.card.add}
          </button>
        </div>

        {/* Flash sale countdown */}
        {onSale && (
          <div className="hidden sm:flex items-center gap-1.5 mt-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1">
            <span className="text-[10px] text-red-500 font-medium">{t.card.flashEnd}</span>
            <Countdown
              endsAt={product.saleEndsAt!}
              className="text-[10px] text-red-600 font-bold"
            />
          </div>
        )}

        {/* Stock + sold count — desktop only */}
        <div className="hidden sm:flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Box className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {t.card.remaining} <strong className="text-gray-600">{product.stock}</strong>
            </span>
          </div>
          {(product.soldCount ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-orange-500 font-medium">{t.card.sold(soldCount)}</span>
            </div>
          )}
          {detailHref && !product.soldCount && (
            <span className="text-xs text-primary-400 font-medium">{t.card.viewPackages}</span>
          )}
        </div>

        {/* Mobile: stock remaining */}
        <div className="sm:hidden mt-1 text-[10px] text-gray-400">
          {t.card.remaining} <strong className="text-gray-600">{product.stock}</strong>
          {detailHref && <span className="ml-1 text-primary-400">→</span>}
        </div>
      </div>
    </>
  )

  const pickerModal = pickerOpen && product.groupKey ? (
    <ProductPickerModal
      groupKey={product.groupKey}
      groupName={product.name.split(' ').slice(0, 3).join(' ')}
      onClose={() => setPickerOpen(false)}
    />
  ) : null

  if (detailHref) {
    return (
      <>
        <Link href={detailHref} className="card group flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(139,92,246,0.3)] cursor-pointer">
          {cardContent}
        </Link>
        {pickerModal}
      </>
    )
  }

  return (
    <>
      <article className="card group flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(139,92,246,0.3)]">
        {cardContent}
      </article>
      {pickerModal}
    </>
  )
}
