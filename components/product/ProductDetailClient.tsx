'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Box, ArrowLeft, Zap } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useStore } from '@/lib/store'
import { StockBadge } from '@/components/ui/Badge'
import { Countdown } from '@/components/ui/Countdown'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  id: string
}

function isFlashSaleActive(product: Product): boolean {
  return !!(
    product.salePrice &&
    product.saleEndsAt &&
    new Date(product.saleEndsAt) > new Date()
  )
}

export function ProductDetailClient({ id }: Props) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saleExpired, setSaleExpired] = useState(false)
  const { addItem, items } = useStore()

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const url = apiUrl ? `${apiUrl}/products/${id}` : `/api/products`

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        setProduct(json.data ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500 mb-4">Khu00f4ng tu00ecm thu1ea5y su1ea3n phu1ea9m.</p>
        <Link href="/#products" className="text-primary-600 hover:underline">u2190 Quay lu1ea1i</Link>
      </div>
    )
  }

  const status = getStockStatus(product.stock)
  const isOut = status === 'out'
  const inCart = items.find((i) => i.product.id === product.id)
  const onSale = !saleExpired && isFlashSaleActive(product)

  return (
    <div>
      <Link
        href="/#products"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lu1ea1i danh su00e1ch
      </Link>

      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative h-72 md:h-auto bg-primary-50">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Details */}
          <div className="p-8 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                  {product.category ?? 'Tu00e0i khou1ea3n Premium'}
                </span>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
              </div>
              <StockBadge status={status} />
            </div>

            <p className="text-gray-600 leading-relaxed">{product.description}</p>

            {/* Flash sale banner */}
            {onSale && (
              <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="font-extrabold text-sm uppercase tracking-widest">Flash Sale</span>
                </div>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-3xl font-extrabold">
                    {formatCurrency(product.salePrice!)}
                  </span>
                  <span className="text-white/70 line-through text-base">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <p className="text-xs font-medium mb-1">Ku1ebft thu00fac sau</p>
                  <Countdown
                    endsAt={product.saleEndsAt!}
                    onExpire={() => setSaleExpired(true)}
                    className="text-2xl font-extrabold tracking-widest"
                  />
                </div>
              </div>
            )}

            {/* Regular price (no sale) */}
            {!onSale && (
              <div className="text-3xl font-extrabold text-primary-700">
                {formatCurrency(product.price)}
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Box className="w-4 h-4" />
              Cu00f2n lu1ea1i: <strong className="text-gray-700">{product.stock}</strong> su1ea3n phu1ea9m
            </div>

            {/* Add to cart */}
            <button
              onClick={() => addItem(product)}
              disabled={isOut}
              className="mt-auto flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-bold rounded-2xl px-6 py-4 transition-all hover:shadow-lg hover:shadow-primary-200 disabled:cursor-not-allowed text-base"
            >
              <ShoppingCart className="w-5 h-5" />
              {isOut ? 'Hu1ebft hu00e0ng' : inCart ? `Thu00eam (${inCart.qty} trong giu1ecf)` : 'Thu00eam vu00e0o giu1ecf'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
