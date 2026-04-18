'use client'

import { useEffect, useState } from 'react'

interface Props {
  endsAt: string
  onExpire?: () => void
  className?: string
}

function getRemaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return { h, m, s }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function Countdown({ endsAt, onExpire, className = '' }: Props) {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt))

  useEffect(() => {
    if (!remaining) return

    const id = setInterval(() => {
      const next = getRemaining(endsAt)
      setRemaining(next)
      if (!next) onExpire?.()
    }, 1_000)

    return () => clearInterval(id)
  }, [endsAt, onExpire, remaining])

  if (!remaining) return null

  const { h, m, s } = remaining

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {h > 0 && <>{pad(h)}:</>}{pad(m)}:{pad(s)}
    </span>
  )
}
