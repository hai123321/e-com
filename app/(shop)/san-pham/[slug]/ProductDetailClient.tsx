'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, ShoppingCart, Zap } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useStore } from '@/lib/store'
import { StockBadge } from '@/components/ui/Badge'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import { getServiceConfig } from '@/lib/service-config'
import { apiUrl, logoUrl } from '@/lib/api'
import { GROUP_META } from './group-meta'
import { BuyNowModal } from '@/components/shop/BuyNowModal'

function extractDurationDays(name: string, description: string): number {
  const text = name + ' ' + description
  const monthMatch = text.match(/(\d+)\s*tháng/)
  const dayMatch = text.match(/(\d+)\s*ngày/)
  if (monthMatch) return parseInt(monthMatch[1]) * 30
  if (dayMatch) return parseInt(dayMatch[1])
  return 30
}

function extractFeatures(description: string): string[] {
  return description
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 3)
}

export default function ProductDetailClient({ slug }: { slug: string }) {
  const { addItem, items } = useStore()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Product | null>(null)
  const [heroImgErr, setHeroImgErr] = useState(false)
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const meta = GROUP_META[slug] ?? { name: slug, tagline: '' }

  useEffect(() => {
    fetch(apiUrl(`/products/group/${slug}`), { signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((json) => {
        const list: Product[] = json.data ?? []
        setProducts(list)
        setSelected(list[0] ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    cardRefs.current.forEach((el) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('pricing-card-visible')
            obs.disconnect()
          }
        },
        { threshold: 0.1 },
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [products.length])

  const svc = getServiceConfig(meta.name, products[0]?.category)

  const tiersWithMeta = products.map((p) => {
    const days = extractDurationDays(p.name, p.description)
    return { product: p, days, pricePerDay: p.price / days }
  })

  const cheapestPricePerDay = tiersWithMeta.length
    ? Math.min(...tiersWithMeta.map((t) => t.pricePerDay))
    : 0
  const highestStockId = products.length
    ? products.reduce((a, b) => (a.stock >= b.stock ? a : b)).id
    : null

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-primary-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </main>
    )
  }

  if (!products.length) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-primary-50">
        <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm.</p>
        <Link href="/" className="text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
      </main>
    )
  }

  const heroImage = logoUrl(products[0]?.image)
  const selectedStatus = selected ? getStockStatus(selected.stock) : 'out'
  const inCart = selected ? items.find((i) => i.product.id === selected.id) : null

  return (
    <>
    <main className="min-h-screen bg-primary-50">
      <style>{`
        .pricing-card {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .pricing-card-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="section-container py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">{meta.name}</span>
          </nav>
        </div>
      </div>

      <div className="section-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left — Brand hero */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden sticky top-24">
              <div className={`relative h-56 bg-gradient-to-br ${svc.bg} flex items-center justify-center`}>
                {heroImage && !heroImgErr ? (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white/10 shadow-xl">
                    <Image src={heroImage} alt={meta.name} fill className="object-contain p-3"
                      unoptimized
                      onError={() => setHeroImgErr(true)} sizes="112px" />
                  </div>
                ) : (
                  <span className="text-7xl">{svc.icon}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
                    {products[0]?.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{meta.name}</h1>
                <p className="text-sm text-gray-500 mb-5">{meta.tagline}</p>

                {/* Selected variant summary */}
                {selected && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-5">
                    <p className="text-xs text-primary-600 font-semibold mb-1">Gói đã chọn</p>
                    <p className="font-bold text-gray-800 text-sm leading-snug">{selected.name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xl font-extrabold text-primary-700">
                        {formatCurrency(selected.price)}
                      </span>
                      <StockBadge status={selectedStatus} />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => selected && addItem(selected)}
                  disabled={!selected || selectedStatus === 'out'}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-bold rounded-xl px-6 py-3.5 transition-all hover:shadow-lg hover:shadow-primary-200 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {!selected || selectedStatus === 'out'
                    ? 'Hết hàng'
                    : inCart
                      ? `Trong giỏ (${inCart.qty}) — Thêm nữa`
                      : 'Thêm vào giỏ hàng'}
                </button>

                {selected && selectedStatus !== 'out' && (
                  <button
                    onClick={() => setBuyNowProduct(selected)}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-6 py-3 mt-2 transition-all hover:shadow-lg hover:shadow-amber-200 text-sm"
                  >
                    <Zap className="w-4 h-4" /> Mua ngay
                  </button>
                )}

                <Link
                  href="/"
                  className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Xem thêm sản phẩm khác
                </Link>
              </div>
            </div>
          </div>

          {/* Right — Pricing card grid */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              Chọn gói phù hợp
              <span className="ml-2 text-sm font-normal text-gray-400">({products.length} gói)</span>
            </h2>

            <div
              className={`grid gap-4 ${
                products.length === 1
                  ? 'grid-cols-1'
                  : products.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
              }`}
            >
              {tiersWithMeta.map(({ product: p, days, pricePerDay }, idx) => {
                const st = getStockStatus(p.stock)
                const isSelected = selected?.id === p.id
                const isOut = st === 'out'
                const isCheapest =
                  Math.abs(pricePerDay - cheapestPricePerDay) < 0.01 && products.length > 1
                const isPopular = p.id === highestStockId && products.length > 1
                const features = extractFeatures(p.description)

                return (
                  <div
                    key={p.id}
                    ref={(el) => { cardRefs.current[idx] = el }}
                    className="pricing-card"
                    style={{ transitionDelay: `${idx * 80}ms` }}
                  >
                    <div
                      onClick={() => !isOut && setSelected(p)}
                      className={`relative h-full flex flex-col rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-500 shadow-lg shadow-primary-100 bg-white'
                          : isOut
                            ? 'border-gray-100 opacity-50 cursor-not-allowed bg-gray-50'
                            : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-white cursor-pointer'
                      } ${isPopular && !isOut ? 'ring-2 ring-primary-400 ring-offset-2' : ''}`}
                    >
                      {/* Badges */}
                      {(isPopular || isCheapest) && !isOut && (
                        <div className="absolute -top-3 left-4 flex gap-2">
                          {isPopular && (
                            <span className="inline-flex items-center gap-1 bg-primary-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                              <Zap className="w-2.5 h-2.5" /> Phổ biến nhất
                            </span>
                          )}
                          {isCheapest && !isPopular && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                              Tiết kiệm nhất
                            </span>
                          )}
                          {isCheapest && isPopular && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                              Tiết kiệm nhất
                            </span>
                          )}
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col">
                        {/* Name */}
                        <h3 className={`font-bold text-sm leading-snug mb-3 ${
                          isSelected ? 'text-primary-700' : 'text-gray-800'
                        }`}>
                          {p.name}
                        </h3>

                        {/* Price */}
                        <div className="mb-4">
                          <span className={`text-2xl font-extrabold ${
                            isSelected ? 'text-primary-600' : 'text-gray-900'
                          }`}>
                            {formatCurrency(p.price)}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {days >= 30
                              ? `${days / 30} tháng · ${formatCurrency(Math.round(pricePerDay))}/ngày`
                              : `${days} ngày · ${formatCurrency(Math.round(pricePerDay))}/ngày`}
                          </p>
                        </div>

                        {/* Features */}
                        <ul className="flex-1 flex flex-col gap-1.5 mb-4">
                          {features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{feat}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Stock */}
                        <div className="flex items-center justify-between mb-3">
                          <StockBadge status={st} />
                          {!isOut && (
                            <span className="text-xs text-gray-400">{p.stock} còn lại</span>
                          )}
                        </div>

                        {/* Buy buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!isOut) addItem(p)
                            }}
                            disabled={isOut}
                            className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                              isOut
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow'
                                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                            }`}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            {isOut ? 'Hết hàng' : items.find((i) => i.product.id === p.id) ? 'Thêm nữa' : 'Thêm giỏ'}
                          </button>
                          {!isOut && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setBuyNowProduct(p) }}
                              className="flex items-center justify-center gap-1 rounded-xl py-2.5 px-3 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow"
                            >
                              <Zap className="w-3 h-3" /> Mua ngay
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>

    {buyNowProduct && (
      <BuyNowModal product={buyNowProduct} onClose={() => setBuyNowProduct(null)} />
    )}
  </>
  )
}
