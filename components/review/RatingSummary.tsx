'use client'

import { useEffect, useState } from 'react'
import { StarRating } from './StarRating'

interface Distribution {
  1: number
  2: number
  3: number
  4: number
  5: number
}

export interface RatingSummaryData {
  averageRating: number
  totalReviews: number
  distribution: Distribution
}

interface RatingSummaryProps {
  productId: string
  refreshKey?: number
}

export function RatingSummary({ productId, refreshKey = 0 }: RatingSummaryProps) {
  const [summary, setSummary] = useState<RatingSummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products/${productId}/reviews?page=1&limit=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.summary) setSummary(json.summary)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId, refreshKey])

  if (loading) {
    return <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
  }

  if (!summary || summary.totalReviews === 0) return null

  const avg = summary.averageRating.toFixed(1)
  const total = summary.totalReviews

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row gap-6">
      {/* Average */}
      <div className="flex flex-col items-center justify-center sm:w-36 flex-shrink-0 gap-1">
        <span className="text-5xl font-extrabold text-gray-900 leading-none">{avg}</span>
        <StarRating value={summary.averageRating} size="md" />
        <span className="text-sm text-gray-500">{total} u0111u00e1nh giu00e1</span>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = summary.distribution[star] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-right text-gray-500 flex-shrink-0">{star}</span>
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-gray-400 flex-shrink-0">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
