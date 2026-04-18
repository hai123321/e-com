'use client'

import { Zap, ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useT } from '@/lib/hooks/useT'
import { BannerSlider } from './BannerSlider'

const STAT_VALUES = ['10K+', '99%', '24/7', '100%']

export function Hero() {
  const t = useT()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 py-10 lg:py-14">
      {/* Background blobs */}
      <div className="hero-blob w-96 h-96 bg-white/5 -top-24 -left-24" />
      <div className="hero-blob w-72 h-72 bg-accent-500/10 bottom-0 right-0" />

      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-center">

          {/* Left — compact text column (2/5) */}
          <div className="lg:col-span-2">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-3 py-1 text-white text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-400" />
              {t.hero.badge}
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
              {t.hero.title1}{' '}
              <span className="text-accent-400">{t.hero.title2}</span>
              <br />
              {t.hero.title3}
            </h1>

            <p className="text-white/70 text-sm mb-5 leading-relaxed line-clamp-3">
              {t.hero.desc}
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-2.5">
              <a href="/#products">
                <Button size="md" variant="primary" className="shadow-lg shadow-accent-500/30">
                  <Zap className="w-4 h-4" />
                  {t.hero.ctaBuy}
                </Button>
              </a>
              <a href="/#contact">
                <Button size="md" variant="outline">
                  {t.hero.ctaContact}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-6 pt-5 border-t border-white/10">
              {t.hero.stats.map((label, i) => (
                <div key={label}>
                  <div className="text-xl font-extrabold text-white">{STAT_VALUES[i]}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — banner slider (3/5) — visible on all screens */}
          <div className="lg:col-span-3">
            <BannerSlider />
          </div>

        </div>
      </div>
    </section>
  )
}
