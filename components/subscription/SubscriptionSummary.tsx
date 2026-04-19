import { AlertTriangle, CreditCard } from 'lucide-react'
import type { SubscriptionSummaryData } from '@/lib/subscriptions'

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

interface SubscriptionSummaryProps {
  summary: SubscriptionSummaryData
}

export function SubscriptionSummary({ summary }: SubscriptionSummaryProps) {
  const { totalMonthly, count, expiringSoon } = summary

  return (
    <div className="space-y-3 mb-6">
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <p className="text-white/70 text-sm">Bu1ea1n u0111ang chi</p>
          <p className="text-2xl font-extrabold">{formatPrice(totalMonthly)}<span className="text-base font-normal text-white/70">/thu00e1ng</span></p>
          <p className="text-white/70 text-xs mt-0.5">cho {count} gu00f3i du1ecbch vu1ee5</p>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Gu00f3i su1eafp hu1ebft hu1ea1n</p>
            <p className="text-xs text-red-600 mt-0.5">
              {expiringSoon.map(s => s.serviceName).join(', ')} — hu00e3y gia hu1ea1n su1edbm
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
