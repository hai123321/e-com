import { ShieldCheck, Users, Zap, RefreshCw } from 'lucide-react'

const signals = [
  { Icon: ShieldCheck, text: 'SSL 256-bit' },
  { Icon: Users,       text: '10,000+ khách hàng hài lòng' },
  { Icon: Zap,         text: 'Giao hàng ngay sau thanh toán' },
  { Icon: RefreshCw,   text: 'Hoàn tiền 100% nếu lỗi' },
]

export function TrustBar() {
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {signals.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span className="text-xs text-gray-700 font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
