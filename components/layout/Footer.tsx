'use client'

import { Store, Facebook, Instagram, Youtube } from 'lucide-react'
import { useT } from '@/lib/hooks/useT'

export function Footer() {
  const t = useT()
  const year = new Date().getFullYear()

  const pages = [
    { href: '/',          label: t.nav.home },
    { href: '/#products', label: t.nav.products },
    { href: '/#contact',  label: t.nav.contact },
  ]

  const policies = [
    { href: '#', label: t.footer.privacy },
    { href: '#', label: t.footer.terms },
    { href: '#', label: t.footer.returns },
  ]

  return (
    <footer className="bg-gradient-to-br from-primary-900 to-primary-700 text-white/80">
      <div className="section-container py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-white font-extrabold text-xl mb-3">
              <Store className="w-6 h-6" />
              Miu Shop
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              {t.footer.desc}
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Facebook, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Youtube, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-accent-500 flex items-center justify-center transition-all hover:-translate-y-0.5"
                >
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">{t.footer.quickLinks}</h4>
            <ul className="space-y-2">
              {pages.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">{t.footer.policies}</h4>
            <ul className="space-y-2">
              {policies.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment logos + trust strip */}
        <div className="border-t border-white/10 pt-6 pb-4">
          <p className="text-xs text-white/40 text-center mb-3">Thanh toán an toàn &amp; bảo mật</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: '#A50064' }}>MoMo</span>
            <span className="px-3 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: '#0866FF' }}>VNPay</span>
            <span className="px-3 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: '#1A1F71' }}>VISA</span>
            <span className="px-3 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: '#252525' }}>MC</span>
            <span className="px-3 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: '#0068FF' }}>ZaloPay</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
          {t.footer.copyright(year)}
        </div>
      </div>
    </footer>
  )
}
