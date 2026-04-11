import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.4,0,0.2,1)',
        'slide-out-right': 'slideOutRight 0.35s cubic-bezier(0.4,0,0.2,1)',
        'fade-in': 'fadeIn 0.2s ease',
        'toast-in': 'toastIn 0.35s cubic-bezier(0.4,0,0.2,1)',
      },
      keyframes: {
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        slideOutRight: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(100%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        toastIn: {
          from: { transform: 'translateX(120%)', opacity: '0' },
          to:   { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
