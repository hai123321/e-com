'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { fetchMe } from '@/lib/auth'

/**
 * Restores user session from localStorage on page load.
 * Must be rendered client-side only (inside layout body).
 */
export function SessionHydrator() {
  const { user, setUser, sessionHydrated, setSessionHydrated } = useStore()

  useEffect(() => {
    if (sessionHydrated) return // already ran once
    const token = localStorage.getItem('user_token')
    if (!token) {
      setSessionHydrated()
      return
    }
    if (user) {
      // Already set (e.g. just logged in this tab)
      setSessionHydrated()
      return
    }
    fetchMe(token).then((profile) => {
      if (profile) setUser(profile, token)
      else localStorage.removeItem('user_token') // token expired/invalid
    }).finally(() => {
      setSessionHydrated()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount only

  return null
}
