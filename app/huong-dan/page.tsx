'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, Loader2, Wrench } from 'lucide-react'
import { useT } from '@/lib/hooks/useT'
import { useStore } from '@/lib/store'

interface Guide {
  id: number
  type: string
  descriptionVi: string
  descriptionEn: string
  descriptionCn: string
  sortOrder: number
}

export default function HuongDanPage() {
  const t = useT()
  const { locale } = useStore()
  const [guides, setGuides] = useState<Guide[]>([])
  const [loadingGuides, setLoadingGuides] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const url = apiUrl ? `${apiUrl}/api/v1/guides` : '/api/guides'
    fetch(url, { signal: AbortSignal.timeout(5000) })
      .then((r) => r.json())
      .then((json) => {
        setGuides(json.data ?? [])
        setLoadingGuides(false)
      })
      .catch(() => setLoadingGuides(false))
  }, [])

  function getDesc(guide: Guide) {
    if (locale === 'en') return guide.descriptionEn || guide.descriptionVi
    if (locale === 'zh') return guide.descriptionCn || guide.descriptionVi
    return guide.descriptionVi
  }

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

        {/* FAQ from i18n */}
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t.guide.faqTitle}</h2>
        <div className="flex flex-col gap-3 mb-14">
          {t.guide.sections.map((section) => (
            <div key={section.title}>
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 mb-3 w-fit ${section.color}`}>
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

        {/* Troubleshooting Guides from DB */}
        <div className="flex items-center gap-2.5 mb-6">
          <Wrench className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-800">{t.guide.troubleshootTitle}</h2>
        </div>

        {loadingGuides ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : guides.length === 0 ? null : (
          <div className="flex flex-col gap-3 mb-14">
            {guides.map((guide) => (
              <details key={guide.id} className="card group">
                <summary className="flex items-center justify-between p-5 cursor-pointer select-none list-none">
                  <span className="font-semibold text-gray-800 pr-4">{guide.type}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <pre className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">
                    {getDesc(guide)}
                  </pre>
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-4 card p-8 text-center bg-gradient-to-br from-primary-600 to-primary-800 text-white">
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
