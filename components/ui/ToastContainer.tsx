'use client'

import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { ToastType } from '@/lib/types'

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
  error:   <XCircle    className="w-5 h-5 text-red-500 shrink-0" />,
  info:    <Info       className="w-5 h-5 text-primary-500 shrink-0" />,
}

const borderColors: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error:   'border-l-red-500',
  info:    'border-l-primary-500',
}

export function ToastContainer() {
  const { toasts, removeToast } = useStore()

  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 bg-white rounded-xl shadow-xl border-l-4 px-4 py-3',
            'min-w-[280px] max-w-sm pointer-events-auto animate-toast-in',
            borderColors[toast.type],
          )}
        >
          {icons[toast.type]}
          <p className="flex-1 text-sm font-medium text-gray-800">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
