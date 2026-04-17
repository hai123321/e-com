'use client'

import Image from 'next/image'
import { ShoppingCart, Box, TrendingUp } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useStore } from '@/lib/store'
import { StockBadge } from '@/components/ui/Badge'
import { FlashSaleBadge } from '@/components/product/FlashSaleBadge'
import { Countdown } from '@/components/ui/Countdown'
import { formatCurrency, getStockStatus, getProductBadge } from '@/lib/utils'

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
  const status = getStockStatus(product.stock)
  const badge = getProductBadge(product.stock, product.soldCount)
  const isOut = status === 'out'
  const inCart = items.find((i) => i.product.id === product.id)
  const onSale = isFlashSaleActive(product)

  return (
    <article className="card group flex flex-col overflow-hidden hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/50 hover:-translate-y-1.5 transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 bg-primary-50 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {onSale && (
            <span className="bg-red-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">
              FLASH
            </span>
          )}
          {badge === 'hot' && (
            <span className="bg-orange-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">
              🔥 HOT
            </span>
          )}
          {badge === 'low' && <StockBadge status="low" />}
          {badge === 'out' && <StockBadge status="out" />}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1.5">
          Tài khoản Premium
        </span>
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">{product.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4 line-clamp-2">
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
                {formatCurrency(product.price)}
              </div>
              <div className="text-xs text-gray-400">/ tài khoản</div>
            </div>
          )}

          <button
            onClick={() => addItem(product)}
            disabled={isOut}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-all hover:shadow-lg hover:shadow-primary-200 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {inCart ? `Thêm (${inCart.qty})` : 'Thêm vào giỏ'}
          </button>
        </div>

        {/* Flash sale countdown */}
        {onSale && (
          <div className="flex items-center gap-1.5 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
            <span className="text-[11px] text-red-500 font-medium">⚡ Kết thúc sau:</span>
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
              Còn lại: <strong className="text-gray-600">{product.stock}</strong>
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
        </div>
      </div>
    </article>
  )
}
