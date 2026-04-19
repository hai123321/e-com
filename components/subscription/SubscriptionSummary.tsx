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
          <p className="text-white/70 text-sm">Bạn đang chi</p>
          <p className="text-2xl font-extrabold">{formatPrice(totalMonthly)}<span className="text-base font-normal text-white/70">/tháng</span></p>
          <p className="text-white/70 text-xs mt-0.5">cho {count} gói dịch vụ</p>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Gói sắp hết hạn</p>
            <p className="text-xs text-red-600 mt-0.5">
              {expiringSoon.map(s => s.serviceName).join(', ')} — hãy gia hạn sớm
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
