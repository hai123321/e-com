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
  const onSale = isFlashSaleActive(product)

  const showImage = product.image && !imgError
  const soldCount = product.soldCount ?? 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isAdding || isOut) return
    addItem(product)
    setIsAdding(true)
    setCartAnimKey((k) => k + 1)
    setTimeout(() => setIsAdding(false), 500)
  }

  const cardContent = (
    <>
      {/* Image / branded fallback */}
      <div className="relative h-32 sm:h-48 overflow-hidden bg-white">
        <div className={`w-full h-full bg-gradient-to-br ${svc.bg} flex flex-col items-center justify-center gap-1 sm:gap-2 group-hover:scale-105 transition-transform duration-500`}>
          {showImage ? (
            <Image
              src={product.image!}
              alt={product.name}
              width={96}
              height={96}
              unoptimized
              className="object-contain w-16 h-16 sm:w-24 sm:h-24 rounded-xl bg-white/10 p-2"
              onError={() => setImgError(true)}
            />
          ) : (
            <>
              <span className="text-3xl sm:text-5xl select-none">{svc.icon}</span>
              <span className="text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider hidden sm:block">
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
            Mới
          </span>
        )}

        <div className="absolute top-2 right-2">
          <StockBadge status={status} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 sm:p-5">
        <span className="text-[10px] sm:text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">
          {t.card.label}
        </span>
        <h3 className="font-bold text-gray-900 text-xs sm:text-base leading-snug mb-1 line-clamp-2">
          {product.name}
        </h3>
        {(product.reviewCount ?? 0) > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 mb-1">
            <StarRating value={product.avgRating ?? 0} size="sm" />
            <span className="text-xs text-gray-400">({product.reviewCount})</span>
          </div>
        )}
        <p className="hidden sm:block text-xs text-gray-400 leading-relaxed flex-1 mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-1 sm:gap-3 mt-auto pt-2 sm:pt-0">
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
                  <span className="text-[10px] sm:text-xs text-gray-400 mr-0.5">Từ</span>
                )}
                {formatCurrency(product.price)}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-400">{t.card.unit}</div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={isOut || isAdding}
            className="flex items-center justify-center gap-1 sm:gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 transition-all hover:shadow-lg hover:shadow-primary-200 disabled:cursor-not-allowed shrink-0"
          >
            <ShoppingCart
              key={cartAnimKey}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isAdding ? 'animate-cart-bounce' : ''}`}
            />
            <span className="hidden sm:inline">
              {isOut ? t.card.outOfStock ?? '—' : inCart ? `${t.card.inCart} (${inCart.qty})` : t.card.add}
            </span>
            <span className="sm:hidden">
              {isOut ? '—' : inCart ? `+${inCart.qty}` : 'Thêm'}
            </span>
          </button>
        </div>

        {/* Flash sale countdown */}
        {onSale && (
          <div className="hidden sm:flex items-center gap-1.5 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
            <span className="text-[11px] text-red-500 font-medium">⚡ Kết thúc sau:</span>
            <Countdown
              endsAt={product.saleEndsAt!}
              className="text-[11px] text-red-600 font-bold"
            />
          </div>
        )}

        {/* Stock + sold count — desktop only */}
        <div className="hidden sm:flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Box className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {t.card.stock} <strong className="text-gray-600">{product.stock}</strong> {t.card.stockUnit}
            </span>
          </div>
          {(product.soldCount ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-orange-500 font-medium">
                {product.soldCount} đã bán
              </span>
            </div>
          )}
          {detailHref && !product.soldCount && (
            <span className="text-xs text-primary-400 font-medium">Xem các gói →</span>
          )}
        </div>

        {/* Mobile: stock remaining */}
        <div className="sm:hidden mt-1.5 text-[10px] text-gray-400">
          Còn lại: <strong className="text-gray-600">{product.stock}</strong> sản phẩm
          {detailHref && <span className="ml-1 text-primary-400">Xem cả →</span>}
        </div>
      </div>
    </>
  )

  if (detailHref) {
    return (
      <Link href={detailHref} className="card group flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(139,92,246,0.3)] cursor-pointer">
        {cardContent}
      </Link>
    )
  }

  return (
    <article className="card group flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(139,92,246,0.3)]">
      {cardContent}
    </article>
  )
}
