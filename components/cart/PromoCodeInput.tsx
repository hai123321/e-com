'use client'

import { useState } from 'react'
import { Tag, X, Check, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

type State = 'idle' | 'loading' | 'valid' | 'invalid'

export function PromoCodeInput() {
  const { promoCode, applyPromo, clearPromo, subtotal } = useCart()
  const [input, setInput] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (promoCode) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-green-700">
          <Tag className="w-4 h-4" />
          <span className="text-sm font-semibold">{promoCode}</span>
        </div>
        <button
          onClick={() => clearPromo()}
          className="text-green-600 hover:text-green-800 transition-colors"
          aria-label="Xóa mã giảm giá"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  async function handleApply() {
    const code = input.trim().toUpperCase()
    if (!code) return
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderTotal: subtotal }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        applyPromo(code, data.discount)
        setState('valid')
        setInput('')
      } else {
        setState('invalid')
        setErrorMsg(data.message || 'Mã không hợp lệ')
      }
    } catch {
      setState('invalid')
      setErrorMsg('Lỗi kết nối, thử lại')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setState('idle') }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Nhập mã giảm giá"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={state === 'loading' || !input.trim()}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
        >
          {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : state === 'valid' ? <Check className="w-4 h-4" /> : 'Áp dụng'}
        </button>
      </div>
      {state === 'invalid' && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
    </div>
  )
}
