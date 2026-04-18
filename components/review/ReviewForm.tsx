'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from './StarRating'
import { useStore } from '@/lib/store'

interface ReviewFormProps {
  productId: string
  onSuccess?: () => void
}

function getUserToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('user_token')
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const router = useRouter()
  const { addToast } = useStore()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!getUserToken())
  }, [])

  if (!isLoggedIn) return null
  if (submitted) return null

  if (duplicate) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-amber-700 text-sm">
        Bu1ea1n u0111u00e3 u0111u00e1nh giu00e1 su1ea3n phu1ea9m nu00e0y ru1ed3i.
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      addToast('Vui lu00f2ng chu1ecdn su1ed1 sao tru01b0u1edbc khi gu1eedi', 'error')
      return
    }

    const token = getUserToken()
    if (!token) {
      router.push('/login')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, rating, comment: comment.trim() || undefined }),
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.status === 409) {
        setDuplicate(true)
        return
      }
      if (!res.ok) {
        throw new Error('Gu1eedi u0111u00e1nh giu00e1 thu1ea5t bu1ea1i')
      }

      addToast('u0110u00e1nh giu00e1 cu1ee7a bu1ea1n u0111u00e3 u0111u01b0u1ee3c gu1eedi!', 'success')
      setSubmitted(true)
      onSuccess?.()
    } catch {
      addToast('Cu00f3 lu1ed7i xu1ea3y ra, vui lu00f2ng thu1eed lu1ea1i', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4">
      <h3 className="font-semibold text-gray-900 text-base">u0110u00e1nh giu00e1 su1ea3n phu1ea9m</h3>

      <div>
        <p className="text-sm text-gray-500 mb-2">Xu1ebfp hu1ea1ng <span className="text-red-500">*</span></p>
        <StarRating
          value={rating}
          interactive
          onChange={setRating}
          size="md"
        />
        {rating === 0 && (
          <p className="text-xs text-gray-400 mt-1">Chu01b0a chu1ecdn sao</p>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-2">
          Nhu1eadn xu00e9t{' '}
          <span className="text-gray-400 text-xs">({comment.length}/1000)</span>
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder="Chia su1ebb tru1ea3i nghiu1ec7m cu1ee7a bu1ea1n..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="self-start bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors"
      >
        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </form>
  )
}
