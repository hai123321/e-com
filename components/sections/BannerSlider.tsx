'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'

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
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/banners'))
      .then(r => r.json())
      .then(json => {
        setBanners(json.data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [banners.length])

  if (loading || banners.length === 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-gradient-to-br from-primary-800 to-primary-600 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <span className="text-white/60 text-2xl font-bold">M</span>
        </div>
        <h3 className="text-white text-xl font-extrabold">Miu Shop</h3>
        <p className="text-white/60 text-sm">Tài khoản số uy tín</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
      {banners.map((b, i) => (
        <a
          href={b.href}
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="w-full h-full bg-gradient-to-br from-primary-800 to-primary-600 flex flex-col items-center justify-center gap-3 p-8 text-center">
            {b.image && (
              <img
                src={b.image}
                alt={b.title}
                className="w-20 h-20 object-contain rounded-2xl bg-white/10 p-2"
              />
            )}
            <h3 className="text-white text-xl font-extrabold">{b.title}</h3>
            {b.subtitle && <p className="text-white/70 text-sm">{b.subtitle}</p>}
            <span className="mt-2 bg-white text-primary-700 text-xs font-bold px-4 py-1.5 rounded-full">
              Xem ngay →
            </span>
          </div>
        </a>
      ))}

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${i === active ? 'bg-white w-6' : 'bg-white/40 w-2'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
