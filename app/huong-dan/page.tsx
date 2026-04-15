'use client'

import { BookOpen, ChevronDown } from 'lucide-react'
import { useT } from '@/lib/hooks/useT'

export default function HuongDanPage() {
  const t = useT()

  return (
    <main className="min-h-screen bg-primary-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-16">
        <div className="section-container">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-accent-300" />
            <span className="text-accent-300 font-semibold text-sm uppercase tracking-wider">
              {t.guide.badge}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{t.guide.title}</h1>
          <p className="text-white/70 text-lg max-w-2xl">{t.guide.sub}</p>
        </div>
      </div>

      <div className="section-container py-12">
        {/* Steps */}
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t.guide.stepsTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {t.guide.steps.map((s, i) => (
            <div key={i} className="card p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-bold text-primary-500 bg-primary-100 px-2.5 py-1 rounded-full">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="font-bold text-gray-800">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t.guide.faqTitle}</h2>
        <div className="flex flex-col gap-8">
          {t.guide.sections.map((section) => (
            <div key={section.title}>
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 mb-4 w-fit ${section.color}`}>
                <h3 className="font-bold text-gray-800">{section.title}</h3>
              </div>
              <div className="flex flex-col gap-3">
                {section.items.map((item) => (
                  <details key={item.q} className="card group">
                    <summary className="flex items-center justify-between p-5 cursor-pointer select-none list-none">
                      <span className="font-semibold text-gray-800 pr-4">{item.q}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 card p-8 text-center bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <h3 className="text-xl font-bold mb-2">{t.guide.cta}</h3>
          <p className="text-white/70 mb-6">{t.guide.ctaDesc}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/#contact"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors"
            >
              {t.guide.ctaChat}
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-colors"
            >
              {t.guide.ctaShop}
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
