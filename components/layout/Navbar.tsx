'use client'

import { useState } from 'react'
import { ShoppingCart, Store, Menu, X, Globe } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/hooks/useT'
import type { Locale } from '@/lib/i18n'

const LOCALES: { value: Locale; flag: string; label: string }[] = [
  { value: 'vi', flag: '🇻🇳', label: 'VI' },
  { value: 'en', flag: '🇬🇧', label: 'EN' },
  { value: 'zh', flag: '🇨🇳', label: '中文' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { openCart, totalItems, locale, setLocale } = useStore()
  const t = useT()
  const count = totalItems()

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/#products', label: t.nav.products },
    { href: '/huong-dan', label: t.nav.guide },
    { href: '/#contact', label: t.nav.contact },
  ]

  const currentLocale = LOCALES.find((l) => l.value === locale) ?? LOCALES[0]

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary-800 to-primary-600 shadow-lg shadow-primary-900/30">
      <nav className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 text-white font-extrabold text-xl">
            <Store className="w-6 h-6" />
            Miu Shop
          </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors relative group"
                >
                  {l.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-accent-400 group-hover:w-full transition-all duration-200" />
                </a>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl px-3 py-2 text-sm font-semibold transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{currentLocale.flag} {currentLocale.label}</span>
                <span className="sm:hidden">{currentLocale.flag}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[120px]">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc.value}
                      onClick={() => { setLocale(loc.value); setLangOpen(false) }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-primary-50 ${
                        locale === loc.value ? 'text-primary-700 bg-primary-50' : 'text-gray-700'
                      }`}
                    >
                      {loc.flag} {loc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{t.nav.cart}</span>
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>

            <button
              className="md:hidden text-white"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-primary-800/95 backdrop-blur-sm border-t border-white/10 animate-fade-in">
          <ul className="section-container py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-white/80 hover:text-white text-sm font-medium py-3 px-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
