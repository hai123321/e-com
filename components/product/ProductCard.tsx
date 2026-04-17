'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Box } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/hooks/useT'
import { StockBadge } from '@/components/ui/Badge'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import { getServiceConfig } from '@/lib/service-config'

interface Props {
  product: Product
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
        <div className="absolute top-3 right-3">
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
          <div>
            <div className="text-xl font-extrabold text-primary-700">
              {product.groupKey && (
                <span className="text-xs text-gray-400 mr-0.5">Từ</span>
              )}
              {formatCurrency(product.price)}
            </div>
            <div className="text-xs text-gray-400">{t.card.unit}</div>
          </div>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(product) }}
            disabled={isOut}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-all hover:shadow-lg hover:shadow-primary-200 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {isOut ? t.card.outOfStock ?? '—' : inCart ? `${t.card.inCart} (${inCart.qty})` : t.card.add}
          </button>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
          <Box className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-400">
            {t.card.stock} <strong className="text-gray-600">{product.stock}</strong> {t.card.stockUnit}
          </span>
          {detailHref && (
            <span className="ml-auto text-xs text-primary-400 font-medium">Xem các gói →</span>
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
