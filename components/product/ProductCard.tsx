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
  const onSale = isFlashSaleActive(product)
  const showImage = product.image && !imgError

  const cardContent = (
    <>
      {/* Image / branded fallback */}
      <div className="relative h-48 overflow-hidden bg-white">
        <div className={`w-full h-full bg-gradient-to-br ${svc.bg} flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-500`}>
          {showImage ? (
            <Image
              src={product.image!}
              alt={product.name}
              width={96}
              height={96}
              unoptimized
              className="object-contain w-24 h-24 rounded-xl bg-white/10 p-2"
              onError={() => setImgError(true)}
            />
          ) : (
            <>
              <span className="text-5xl select-none">{svc.icon}</span>
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                {product.category ?? 'Premium'}
              </span>
            </>
          )}
        </div>

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {onSale && (
            <span className="bg-red-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">
              FLASH
            </span>
          )}
          <StockBadge status={status} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1.5">
          {t.card.label}
        </span>
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{product.name}</h3>
        <p className="text-xs text-gray-400 leading-relaxed flex-1 mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-3">
          {onSale ? (
            <FlashSaleBadge
              originalPrice={product.price}
              salePrice={product.salePrice!}
              saleEndsAt={product.saleEndsAt!}
              compact
            />
          ) : (
            <div>
              <div className="text-xl font-extrabold text-primary-700">
                {detailHref && (
                  <span className="text-xs text-gray-400 mr-0.5">Tu1eeb</span>
                )}
                {formatCurrency(product.price)}
              </div>
              <div className="text-xs text-gray-400">{t.card.unit}</div>
            </div>
          )}

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(product) }}
            disabled={isOut}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-all hover:shadow-lg hover:shadow-primary-200 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {isOut ? t.card.outOfStock ?? 'u2014' : inCart ? `${t.card.inCart} (${inCart.qty})` : t.card.add}
          </button>
        </div>

        {/* Flash sale countdown */}
        {onSale && (
          <div className="flex items-center gap-1.5 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
            <span className="text-[11px] text-red-500 font-medium">u26a1 Ku1ebft thu00fac sau:</span>
            <Countdown
              endsAt={product.saleEndsAt!}
              className="text-[11px] text-red-600 font-bold"
            />
          </div>
        )}

        {/* Stock + sold count */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
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
                {product.soldCount} u0111u00e3 bu00e1n
              </span>
            </div>
          )}
          {detailHref && !product.soldCount && (
            <span className="text-xs text-primary-400 font-medium">Xem cu00e1c gu00f3i u2192</span>
          )}
        </div>
      </div>
    </>
  )

  if (detailHref) {
    return (
      <Link href={detailHref} className="card group flex flex-col overflow-hidden hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/50 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
        {cardContent}
      </Link>
    )
  }

  return (
    <article className="card group flex flex-col overflow-hidden hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/50 hover:-translate-y-1.5 transition-all duration-300">
      {cardContent}
    </article>
  )
}
