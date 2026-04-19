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

      {/* Zalo icon — clean speech-bubble silhouette */}
      <svg
        className="relative z-10 shrink-0"
        width="24" height="24" viewBox="0 0 24 24"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Bubble body: rounded rect */}
        <path
          d="M2 5.5A3.5 3.5 0 0 1 5.5 2h13A3.5 3.5 0 0 1 22 5.5v9A3.5 3.5 0 0 1 18.5 18H9l-5 4 1.5-4H5.5A3.5 3.5 0 0 1 2 14.5v-9Z"
          fill="white"
        />
        {/* Three dots — chat activity indicator */}
        <circle cx="8"  cy="12" r="1.3" fill="#0068FF"/>
        <circle cx="12" cy="12" r="1.3" fill="#0068FF"/>
        <circle cx="16" cy="12" r="1.3" fill="#0068FF"/>
      </svg>

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
