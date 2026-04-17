'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { fetchMe } from '@/lib/auth'

/**
 * Restores user session from localStorage on page load.
 * Must be rendered client-side only (inside layout body).
 */
export function SessionHydrator() {
  const { user, setUser } = useStore()

  useEffect(() => {
    if (user) return // already hydrated (e.g. just logged in)
    const token = localStorage.getItem('user_token')
    if (!token) return
    fetchMe(token).then((profile) => {
      if (profile) setUser(profile, token)
      else localStorage.removeItem('user_token') // token expired/invalid
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount only

  return null
}
