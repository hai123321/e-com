import Image from 'next/image'
import { Clock, Pencil, Trash2, ExternalLink } from 'lucide-react'
import type { Subscription } from '@/lib/subscriptions'

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

interface SubscriptionCardProps {
  subscription: Subscription
  onEdit: (sub: Subscription) => void
  onDelete: (id: number) => void
}

export function SubscriptionCard({ subscription, onEdit, onDelete }: SubscriptionCardProps) {
  const { serviceName, logoUrl, monthlyPrice, billingCycle, expiresAt, savingsPercent, miuSuggestedProductId } = subscription

  const expiringSoon = expiresAt ? daysUntil(expiresAt) <= 7 : false
  const daysLeft = expiresAt ? daysUntil(expiresAt) : null

  const displayPrice = billingCycle === 'yearly'
    ? Math.round(monthlyPrice / 12)
    : monthlyPrice

  return (
    <div className={`card p-5 flex items-start gap-4 relative ${
      expiringSoon ? 'border-red-200 bg-red-50/30' : ''
    }`}>
      {/* Logo */}
      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
        {logoUrl ? (
          <Image src={logoUrl} alt={serviceName} width={48} height={48} className="w-full h-full object-contain" unoptimized />
        ) : (
          <span className="text-lg font-bold text-primary-600">{serviceName.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900">{serviceName}</p>
          {expiringSoon && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              Sắp hết hạn
            </span>
          )}
        </div>

        <p className="text-primary-700 font-bold text-sm mt-0.5">
          {formatPrice(displayPrice)}<span className="text-gray-400 font-normal">/tháng</span>
          {billingCycle === 'yearly' && (
            <span className="text-xs text-gray-400 ml-1">(thanh toán năm)</span>
          )}
        </p>

        {expiresAt && (
          <p className="text-xs text-gray-400 mt-1">
            Hết hạn: {formatDate(expiresAt)}
            {daysLeft !== null && daysLeft > 0 && (
              <span className={`ml-1.5 font-medium ${ daysLeft <= 7 ? 'text-red-500' : 'text-gray-500' }`}>
                (còn {daysLeft} ngày)
              </span>
            )}
            {daysLeft !== null && daysLeft <= 0 && (
              <span className="ml-1.5 font-medium text-red-600">(đã hết hạn)</span>
            )}
          </p>
        )}

        {/* MiuShop suggestion chip */}
        {miuSuggestedProductId && savingsPercent && savingsPercent > 0 && (
          <a
            href={`/san-pham?highlight=${miuSuggestedProductId}`}
            className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-accent-600 bg-accent-50 border border-accent-200 px-2.5 py-1 rounded-full hover:bg-accent-100 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            MiuShop có thể tiết kiệm {savingsPercent}%
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => onEdit(subscription)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
          title="Chỉnh sửa"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(subscription.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Xóa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
