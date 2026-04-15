'use client'
import { useStore } from '@/lib/store'
import { translations } from '@/lib/i18n'

export function useT() {
  const locale = useStore((s) => s.locale)
  return translations[locale]
}
