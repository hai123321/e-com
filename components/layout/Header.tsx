'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ShoppingCart, Store, Menu, X, Globe, Bell } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useCart } from '@/hooks/useCart'
import { MiniCart } from '@/components/cart/MiniCart'
import { useT } from '@/lib/hooks/useT'
import type { Locale } from '@/lib/i18n'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from '@/lib/notifications'

const LOCALES: { value: Locale; flag: string; label: string }[] = [
  { value: 'vi', flag: '🇻🇳', label: 'VI' },
  { value: 'en', flag: '🇬🇧', label: 'EN' },
  { value: 'zh', flag: '🇨🇳', label: '中文' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { locale, setLocale, user, userToken, clearUser, openMiniCart, closeMiniCart, isMiniCartOpen } = useStore()
  const { itemCount } = useCart()
  const t = useT()
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const langDropdownRef = useRef<HTMLDivElement>(null)
  const notifDropdownRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    if (!userToken) return
    const data = await fetchNotifications(userToken)
    setNotifications(data.items)
    setUnreadCount(data.unread)
  }, [userToken])

  // Load on mount + poll every 30s
  useEffect(() => {
    if (!user) return
    loadNotifications()
    const interval = setInterval(loadNotifications, 30_000)
    return () => clearInterval(interval)
  }, [user, loadNotifications])

  const handleMarkAllRead = async () => {
    if (!userToken) return
    await markAllNotificationsRead(userToken)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const [expandedNotifId, setExpandedNotifId] = useState<number | null>(null)

  const handleNotifClick = async (notif: UserNotification) => {
    setExpandedNotifId((prev) => (prev === notif.id ? null : notif.id))
    if (!userToken || notif.isRead) return
    await markNotificationRead(userToken, notif.id)
    setNotifications((prev) =>
      prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n)
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

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
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
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

            {/* Notification bell — only for logged-in users */}
            {user && (
              <div className="relative" ref={notifDropdownRef}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative flex items-center justify-center bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl p-2 transition-all"
                  aria-label="Thông báo"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40 md:hidden" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-96 max-h-[520px] flex flex-col overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                        <span className="text-sm font-semibold text-gray-900">Thông báo</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
                          >
                            Đọc tất cả
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                            <Bell className="w-8 h-8 opacity-30" />
                            <span className="text-sm">Không có thông báo</span>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const isExpanded = expandedNotifId === notif.id
                            const accountInfo = notif.meta?.accountInfo as string | null | undefined
                            const instructions = notif.meta?.instructions as string | null | undefined
                            const hasDetails = !!(accountInfo || instructions)
                            return (
                              <div
                                key={notif.id}
                                className={`border-b border-gray-50 transition-colors ${!notif.isRead ? 'bg-primary-50/60' : ''}`}
                              >
                                {/* Header row — always visible */}
                                <button
                                  onClick={() => handleNotifClick(notif)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50/80 transition-colors flex gap-3 items-start"
                                >
                                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-primary-500' : 'bg-gray-200'}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                      {notif.title}
                                    </p>
                                    {!isExpanded && notif.body && (
                                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 whitespace-pre-line">
                                        {notif.body.split('\n')[0]}
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between mt-1">
                                      <p className="text-xs text-gray-400">
                                        {new Date(notif.createdAt).toLocaleString('vi-VN', {
                                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                                        })}
                                      </p>
                                      {hasDetails && (
                                        <span className="text-xs text-primary-600 font-medium">
                                          {isExpanded ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>

                                {/* Expanded detail panel */}
                                {isExpanded && (
                                  <div className="px-4 pb-4 space-y-3">
                                    {accountInfo && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                        <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
                                          📋 Thông tin tài khoản
                                        </p>
                                        <pre className="text-xs text-blue-900 whitespace-pre-wrap font-mono leading-relaxed break-all">
                                          {accountInfo}
                                        </pre>
                                        <button
                                          onClick={() => navigator.clipboard?.writeText(accountInfo)}
                                          className="mt-2 text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                        >
                                          📋 Sao chép
                                        </button>
                                      </div>
                                    )}
                                    {instructions && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                        <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                                          📖 Hướng dẫn sử dụng
                                        </p>
                                        <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">
                                          {instructions}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
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
