'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  size?: 'sm' | 'md'
  interactive?: boolean
  onChange?: (v: number) => void
  className?: string
}

export function StarRating({
  value,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const starSize = size === 'sm' ? 16 : 22
  const gap = size === 'sm' ? 'gap-0.5' : 'gap-1'
  const display = interactive && hovered > 0 ? hovered : value

  function getFill(index: number): 'full' | 'half' | 'empty' {
    const star = index + 1
    if (display >= star) return 'full'
    if (!interactive && display >= star - 0.5) return 'half'
    return 'empty'
  }

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>, index: number) {
    const rect = e.currentTarget.getBoundingClientRect()
    const isLeft = e.clientX - rect.left < rect.width / 2
    setHovered(isLeft ? index + 0.5 : index + 1)
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>, index: number) {
    if (!onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const isLeft = e.clientX - rect.left < rect.width / 2
    onChange(isLeft ? index + 0.5 : index + 1)
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLButtonElement>, index: number) {
    e.preventDefault()
    if (!onChange) return
    const touch = e.changedTouches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const isLeft = touch.clientX - rect.left < rect.width / 2
    onChange(isLeft ? index + 0.5 : index + 1)
    setHovered(0)
  }

  const stars = [0, 1, 2, 3, 4]

  if (!interactive) {
    return (
      <div
        className={cn('flex items-center', gap, className)}
        role="img"
        aria-label={`${value} trên 5 sao`}
      >
        {stars.map((index) => {
          const fill = getFill(index)
          return (
            <svg
              key={index}
              width={starSize}
              height={starSize}
              viewBox="0 0 24 24"
              className="flex-shrink-0"
            >
              <defs>
                <linearGradient id={`half-${index}`}>
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#e5e7eb" />
                </linearGradient>
              </defs>
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={
                  fill === 'full'
                    ? '#f59e0b'
                    : fill === 'half'
                    ? `url(#half-${index})`
                    : '#e5e7eb'
                }
                stroke="#f59e0b"
                strokeWidth="0.5"
              />
            </svg>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-center', gap, className)}
      onMouseLeave={() => setHovered(0)}
      role="group"
      aria-label="Chọn số sao"
    >
      {stars.map((index) => {
        const fill = getFill(index)
        return (
          <button
            key={index}
            type="button"
            onMouseMove={(e) => handleMouseMove(e, index)}
            onClick={(e) => handleClick(e, index)}
            onTouchEnd={(e) => handleTouchEnd(e, index)}
            className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 touch-manipulation"
            aria-label={`${index + 1} sao`}
          >
            <svg
              width={starSize}
              height={starSize}
              viewBox="0 0 24 24"
              className="transition-colors duration-100"
            >
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={fill === 'full' ? '#f59e0b' : '#e5e7eb'}
                stroke="#f59e0b"
                strokeWidth="0.5"
                className="transition-colors duration-100"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
