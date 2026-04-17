'use client'

import { Zap } from 'lucide-react'
import { useState } from 'react'
import { Countdown } from '@/components/ui/Countdown'
import { formatCurrency } from '@/lib/utils'

interface Props {
  originalPrice: number
  salePrice: number
  saleEndsAt: string
  compact?: boolean
}

export function FlashSaleBadge({ originalPrice, salePrice, saleEndsAt, compact = false }: Props) {
  const [expired, setExpired] = useState(false)

  if (expired || new Date(saleEndsAt) <= new Date()) return null

  const discountPct = Math.round((1 - salePrice / originalPrice) * 100)

  return (
    <div className="flex flex-col gap-1">
      {/* Badge */}
      <div className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit">
        <Zap className="w-2.5 h-2.5 fill-current" />
        Flash Sale
        {!compact && discountPct > 0 && <span className="ml-0.5">-{discountPct}%</span>}
      </div>

      {/* Pricing row */}
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-extrabold text-red-600">
          {formatCurrency(salePrice)}
        </span>
        <span className="text-xs text-gray-400 line-through">
          {formatCurrency(originalPrice)}
        </span>
      </div>

      {/* Countdown */}
      {!compact && (
        <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <span>Kết thúc sau:</span>
          <Countdown endsAt={saleEndsAt} onExpire={() => setExpired(true)} />
        </div>
      )}
    </div>
  )
}
