import type { MetadataRoute } from 'next'
import type { Product } from '@/lib/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://miushop.io.vn'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function fetchAllGroupSlugs(): Promise<string[]> {
  if (!API_URL) return []
  try {
    const res = await fetch(`${API_URL}/api/v1/products`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json()
    const products: Product[] = json.data ?? []
    const seen = new Set<string>()
    for (const p of products) {
      if (p.groupKey) seen.add(p.groupKey)
    }
    return Array.from(seen)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchAllGroupSlugs()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/san-pham`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  const productRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/san-pham/${slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
