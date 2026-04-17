'use client'

import { useState } from 'react'

export function FloatingContact() {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href="https://zalo.me/0383574189"
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Chat qua Zalo"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full text-white text-sm font-bold shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
      style={{
        backgroundColor: '#0068FF',
        padding: hovered ? '10px 18px' : '10px 14px',
      }}
    >
      {/* Pulse ring */}
      <span
        className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{ backgroundColor: '#0068FF' }}
      />

      {/* Zalo icon mark */}
      <span className="relative z-10 font-extrabold text-base leading-none">Z</span>

      {/* Expand label */}
      <span
        className="relative z-10 overflow-hidden whitespace-nowrap transition-all duration-300"
        style={{ maxWidth: hovered ? '80px' : '0px', opacity: hovered ? 1 : 0 }}
      >
        Chat Zalo
      </span>
    </a>
  )
}
