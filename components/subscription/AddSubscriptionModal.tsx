import { useState } from 'react'
import { X, Download } from 'lucide-react'
import type { BillingCycle, CreateSubscriptionInput, Subscription } from '@/lib/subscriptions'

interface AddSubscriptionModalProps {
  onClose: () => void
  onSave: (data: CreateSubscriptionInput) => Promise<void>
  onImport: () => Promise<void>
  editTarget?: Subscription | null
}

export function AddSubscriptionModal({ onClose, onSave, onImport, editTarget }: AddSubscriptionModalProps) {
  const [serviceName, setServiceName] = useState(editTarget?.serviceName ?? '')
  const [price, setPrice] = useState(editTarget?.monthlyPrice?.toString() ?? '')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(editTarget?.billingCycle ?? 'monthly')
  const [expiresAt, setExpiresAt] = useState(
    editTarget?.expiresAt ? editTarget.expiresAt.substring(0, 10) : ''
  )
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceName.trim()) { setError('Vui lòng nhập tên dịch vụ'); return }
    const priceNum = parseInt(price, 10)
    if (!priceNum || priceNum <= 0) { setError('Giá không hợp lệ'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({
        serviceName: serviceName.trim(),
        monthlyPrice: priceNum,
        billingCycle,
        expiresAt: expiresAt || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setError('')
    try {
      await onImport()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import thất bại')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            {editTarget ? 'Chỉnh sửa gói' : 'Thêm gói đăng ký'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên dịch vụ *</label>
            <input
              type="text"
              value={serviceName}
              onChange={e => setServiceName(e.target.value)}
              placeholder="Netflix, Spotify, Adobe..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá (VND) *</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="199000"
              min={1}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chu kỳ thanh toán</label>
            <div className="flex gap-2">
              {(['monthly', 'yearly'] as const).map(cycle => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    billingCycle === cycle
                      ? 'bg-primary-700 border-primary-700 text-white'
                      : 'border-gray-300 text-gray-600 hover:border-primary-400'
                  }`}
                >
                  {cycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày hết hạn</label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              {saving ? 'Đang lưu...' : (editTarget ? 'Lưu thay đổi' : 'Thêm gói')}
            </button>

            {!editTarget && (
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="w-full flex items-center justify-center gap-2 border border-primary-300 text-primary-700 hover:bg-primary-50 disabled:opacity-60 font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                {importing ? 'Đang import...' : 'Nhập từ lịch sử mua MiuShop'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
