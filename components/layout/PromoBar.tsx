'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useT } from '@/lib/hooks/useT'

export function PromoBar() {
  const [dismissed, setDismissed] = useState(false)
  const t = useT()

  if (dismissed) return null

  return (
    <div className="relative bg-amber-400 text-gray-900 text-xs font-semibold text-center py-2 px-4">
      <span>{t.promoBar.message}</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Close"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-amber-500 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
