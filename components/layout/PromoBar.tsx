'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function PromoBar() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="relative bg-amber-400 text-gray-900 text-xs font-semibold text-center py-2 px-4">
      <span>
        🔥 Giao hàng ngay sau thanh toán · Bảo hành đúng thời hạn · Hỗ trợ 24/7 qua Zalo
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Đóng thông báo"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-amber-500 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
