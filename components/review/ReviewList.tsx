'use client'

import { useEffect, useState } from 'react'
import { StarRating } from './StarRating'

interface ReviewUser {
  id: string
  name: string
  avatarUrl?: string
}

export interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  user: ReviewUser
}

interface ReviewListProps {
  productId: string
  refreshKey?: number
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function ReviewList({ productId, refreshKey = 0 }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const PAGE_SIZE = 5

  async function fetchReviews(p: number, append = false) {
    try {
      const res = await fetch(
        `/api/products/${productId}/reviews?page=${p}&limit=${PAGE_SIZE}`,
      )
      if (!res.ok) return
      const json = await res.json()
      const fetched: Review[] = json.reviews ?? []
      setHasMore(json.hasMore ?? fetched.length === PAGE_SIZE)
      setReviews((prev) => (append ? [...prev, ...fetched] : fetched))
    } catch {
      // silently keep previous state
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(1)
    setLoading(true)
    fetchReviews(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, refreshKey])

  function loadMore() {
    const next = page + 1
    setPage(next)
    setLoadingMore(true)
    fetchReviews(next, true)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        <p className="font-medium">Chu01b0a cu00f3 u0111u00e1nh giu00e1 nu00e0o</p>
        <p className="text-sm mt-1">Hu00e3y lu00e0 ngu01b0u1eddi u0111u1ea7u tiu00ean u0111u00e1nh giu00e1 su1ea3n phu1ea9m nu00e0y!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3">
          <Avatar name={review.user.name} avatarUrl={review.user.avatarUrl} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{review.user.name}</span>
              <span className="text-gray-400 text-xs">{formatDate(review.createdAt)}</span>
            </div>
            <StarRating value={review.rating} size="sm" className="mt-1 mb-2" />
            {review.comment && (
              <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
            )}
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loadingMore ? 'u0110ang tu1ea3i...' : 'Xem thu00eam u0111u00e1nh giu00e1'}
        </button>
      )}
    </div>
  )
}
