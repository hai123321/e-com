import { cn } from '@/lib/utils'
import type { StockStatus } from '@/lib/types'
import { getStockLabel } from '@/lib/utils'

const statusStyles: Record<StockStatus, string> = {
  high:   'bg-emerald-500/90 text-white',
  medium: 'bg-amber-500/90 text-white',
  low:    'bg-red-500/90 text-white',
  out:    'bg-gray-500/90 text-white',
}

interface StockBadgeProps {
  status: StockStatus
  className?: string
}

export function StockBadge({ status, className }: StockBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
        statusStyles[status],
        className,
      )}
    >
      {getStockLabel(status)}
    </span>
  )
}
