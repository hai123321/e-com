'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Store, Menu, X, Globe } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useCart } from '@/hooks/useCart'
import { MiniCart } from '@/components/cart/MiniCart'
import { useT } from '@/lib/hooks/useT'
import type { Locale } from '@/lib/i18n'

const LOCALES: { value: Locale; flag: string; label: string }[] = [
  { value: 'vi', flag: '🇻🇳', label: 'VI' },
  { value: 'en', flag: '🇬🇧', label: 'EN' },
  { value: 'zh', flag: '🇨🇳', label: '中文' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const { locale, setLocale, user, clearUser, openMiniCart, closeMiniCart, isMiniCartOpen } = useStore()
  const { itemCount } = useCart()
  const t = useT()
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const langDropdownRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/#products', label: t.nav.products },
    { href: '/huong-dan', label: t.nav.guide },
    { href: '/#contact', label: t.nav.contact },
  ]

  const currentLocale = LOCALES.find((l) => l.value === locale) ?? LOCALES[0]

  // Close dropdowns when clicking outside (desktop)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserOpen(false)
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary-800 to-primary-600 shadow-lg shadow-primary-900/30">
      <nav className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-xl">
            <Store className="w-6 h-6" />
            Miu Shop
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors relative group"
                >
                  {l.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-accent-400 group-hover:w-full transition-all duration-200" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language switcher */}
            <div className="relative" ref={langDropdownRef}>
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

            {/* User auth — visible on ALL screen sizes */}
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserOpen((o) => !o)}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl px-2.5 py-2 sm:px-3 text-sm font-semibold transition-all"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {(user.name ?? '').charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.name}</span>
                </button>

                {userOpen && (
                  <>
                    {/* Backdrop for mobile tap-outside-to-close */}
                    <div
                      className="fixed inset-0 z-40 md:hidden"
                      onClick={() => setUserOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[200px]">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/tai-khoan"
                        onClick={() => setUserOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        {t.header.myAccount}
                      </Link>
                      <Link
                        href="/tai-khoan?tab=orders"
                        onClick={() => setUserOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        {t.header.orderHistory}
                      </Link>
                      <div className="border-t border-gray-100" />
                      <button
                        onClick={() => { clearUser(); setUserOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        {t.header.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Login button — visible on ALL screen sizes */
              <Link
                href="/dang-nhap"
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl px-2.5 py-2 sm:px-3 text-sm font-semibold transition-all"
              >
                <span className="hidden sm:inline">{t.header.login}</span>
                <span className="sm:hidden text-base leading-none">👤</span>
              </Link>
            )}

            {/* Cart with mini-cart */}
            <div className="relative">
              <button
                onClick={() => isMiniCartOpen ? closeMiniCart() : openMiniCart()}
                className="relative flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl px-3 py-2 sm:px-4 text-sm font-semibold transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">{t.nav.cart}</span>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>
              <MiniCart />
            </div>

            {/* Hamburger — mobile only, nav links only */}
            <button
              className="md:hidden text-white p-1"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav menu — nav links only, no auth */}
      {menuOpen && (
        <div className="md:hidden bg-primary-800/95 backdrop-blur-sm border-t border-white/10 animate-fade-in">
          <ul className="section-container py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-white/80 hover:text-white text-sm font-medium py-3 px-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
