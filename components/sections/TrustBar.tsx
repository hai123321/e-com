'use client'

import { ShieldCheck, Users, Zap, RefreshCw } from 'lucide-react'
import { useT } from '@/lib/hooks/useT'

const ICONS = [ShieldCheck, Users, Zap, RefreshCw]

export function TrustBar() {
  const t = useT()

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {t.trust.map((text, i) => {
            const Icon = ICONS[i]
            return (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span className="text-xs text-gray-700 font-medium">{text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
