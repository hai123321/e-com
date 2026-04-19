'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { useT } from '@/lib/hooks/useT'

interface Banner {
  id: number
  title: string
  subtitle: string
  image: string
  href: string
  priority: number
  isActive: boolean
}

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [active, setActive]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [paused, setPaused]   = useState(false)
  // Track which banner images failed to load so we can fall back to gradient
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const t = useT()

  // Swipe tracking
  const touchStartX = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 50

  useEffect(() => {
    fetch(apiUrl('/banners'))
      .then(r => r.json())
      .then(json => { setBanners(json.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const prev = useCallback(() => setActive(a => (a - 1 + banners.length) % banners.length), [banners.length])
  const next = useCallback(() => setActive(a => (a + 1) % banners.length), [banners.length])

  useEffect(() => {
    if (banners.length <= 1 || paused) return
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [banners.length, paused, next])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setPaused(true)
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      delta > 0 ? next() : prev()
    }
    touchStartX.current = null
    setPaused(false)
  }, [next, prev])

  /* ── Placeholder while loading / no banners ── */
  if (loading || banners.length === 0) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-800 to-primary-600"
        style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <span className="text-white/60 text-2xl font-extrabold">M</span>
          </div>
          <p className="text-white/50 text-sm">{t.banner.tagline}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl group"
      style={{ aspectRatio: '16/9' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {banners.map((b, i) => (
        <a
          key={b.id}
          href={b.href}
          aria-label={b.title}
          className={`absolute inset-0 transition-opacity duration-500 ${
            i === active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Full-cover image — falls back to gradient if file missing */}
          {b.image && !imgErrors[b.id] ? (
            <Image
              src={b.image}
              alt={b.title}
              fill
              unoptimized
              className="object-cover"
              priority={i === 0}
              onError={() => setImgErrors(prev => ({ ...prev, [b.id]: true }))}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-primary-600" />
          )}

          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Text overlay */}
          {(b.title || b.subtitle) && (
            <div className="absolute bottom-0 left-0 right-0 px-5 py-4">
              {b.title && (
                <p className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow line-clamp-1">
                  {b.title}
                </p>
              )}
              {b.subtitle && (
                <p className="text-white/80 text-xs sm:text-sm mt-0.5 drop-shadow line-clamp-1">
                  {b.subtitle}
                </p>
              )}
            </div>
          )}
        </a>
      ))}

      {/* Prev / Next arrows — show on hover */}
      {banners.length > 1 && (
        <>
          <button
            onClick={e => { e.preventDefault(); prev() }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.preventDefault(); next() }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.preventDefault(); setActive(i) }}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? 'bg-white w-6 h-2.5'
                  : 'bg-white/50 hover:bg-white/80 w-2.5 h-2.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
