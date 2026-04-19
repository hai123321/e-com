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
    if (!serviceName.trim()) { setError('Vui lu00f2ng nhu1eadp tu00een du1ecbch vu1ee5'); return }
    const priceNum = parseInt(price, 10)
    if (!priceNum || priceNum <= 0) { setError('Giu00e1 khu00f4ng hu1ee3p lu1ec7'); return }
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
      setError(err instanceof Error ? err.message : 'Lu01b0u thu1ea5t bu1ea1i')
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
      setError(err instanceof Error ? err.message : 'Import thu1ea5t bu1ea1i')
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
            {editTarget ? 'Chu1ec9nh su1eeda gu00f3i' : 'Thu00eam gu00f3i u0111u0103ng ku00fd'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tu00een du1ecbch vu1ee5 *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giu00e1 (VND) *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chu ku1ef3 thanh tou00e1n</label>
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
                  {cycle === 'monthly' ? 'Hu00e0ng thu00e1ng' : 'Hu00e0ng nu0103m'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngu00e0y hu1ebft hu1ea1n</label>
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
              {saving ? 'u0110ang lu01b0u...' : (editTarget ? 'Lu01b0u thay u0111u1ed5i' : 'Thu00eam gu00f3i')}
            </button>

            {!editTarget && (
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="w-full flex items-center justify-center gap-2 border border-primary-300 text-primary-700 hover:bg-primary-50 disabled:opacity-60 font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                {importing ? 'u0110ang import...' : 'Nhu1eadp tu1eeb lu1ecbch su1eed mua MiuShop'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
