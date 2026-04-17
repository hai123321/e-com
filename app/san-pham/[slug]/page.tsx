import type { Metadata } from 'next'
import Script from 'next/script'
import ProductDetailClient, { GROUP_META } from './ProductDetailClient'
import type { Product } from '@/lib/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://miushop.io.vn'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function fetchProductGroup(slug: string): Promise<Product[]> {
  if (!API_URL) return []
  try {
    const res = await fetch(`${API_URL}/api/v1/products/group/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const meta = GROUP_META[slug] ?? { name: slug, tagline: '' }
  const products = await fetchProductGroup(slug)
  const cheapest = products.reduce<Product | null>(
    (min, p) => (!min || p.price < min.price ? p : min),
    null
  )

  const title = `${meta.name} giá rẻ – Miu Shop`
  const description = cheapest
    ? `Mua tài khoản ${meta.name} chính hãng chỉ từ ${cheapest.price.toLocaleString('vi-VN')}đ. ${meta.tagline}. Giao ngay sau thanh toán.`
    : `Mua tài khoản ${meta.name} chính hãng giá rẻ tại Miu Shop. ${meta.tagline}`

  const image = cheapest?.image ?? `${SITE_URL}/og-default.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/san-pham/${slug}`,
      type: 'website',
      images: image ? [{ url: image, width: 800, height: 600, alt: meta.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/san-pham/${slug}`,
    },
  }
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const meta = GROUP_META[slug] ?? { name: slug, tagline: '' }
  const products = await fetchProductGroup(slug)
  const cheapest = products.reduce<Product | null>(
    (min, p) => (!min || p.price < min.price ? p : min),
    null
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${meta.name} – Miu Shop`,
    description: meta.tagline,
    url: `${SITE_URL}/san-pham/${slug}`,
    ...(cheapest && {
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: cheapest.price,
        priceCurrency: 'VND',
        offerCount: products.length,
      },
    }),
  }

  return (
    <>
      <Script
        id={`jsonld-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient slug={slug} />
    </>
  )
}
