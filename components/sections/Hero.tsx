'use client'

import { Zap, ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useT } from '@/lib/hooks/useT'
import { BannerSlider } from './BannerSlider'

const STAT_VALUES = ['10K+', '99%', '24/7', '100%']

export function Hero() {
  const t = useT()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 py-14 lg:py-16">
      {/* Background blobs */}
      <div className="hero-blob w-96 h-96 bg-white/5 -top-24 -left-24" />
      <div className="hero-blob w-72 h-72 bg-accent-500/10 bottom-0 right-0" />

      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Left column */}
          <div className="lg:col-span-3">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-white text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4 text-accent-400" />
              {t.hero.badge}
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              {t.hero.title1}{' '}
              <span className="text-accent-400">{t.hero.title2}</span>
              <br />
              {t.hero.title3}
            </h1>

            <p className="text-white/75 text-base mb-6 leading-relaxed">
              {t.hero.desc}
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <a href="/#products">
                <Button size="lg" variant="primary" className="shadow-lg shadow-accent-500/30">
                  <Zap className="w-5 h-5" />
                  {t.hero.ctaBuy}
                </Button>
              </a>
              <a href="/#contact">
                <Button size="lg" variant="outline">
                  {t.hero.ctaContact}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-white/10">
              {t.hero.stats.map((label, i) => (
                <div key={label}>
                  <div className="text-2xl font-extrabold text-white">{STAT_VALUES[i]}</div>
                  <div className="text-xs text-white/50 uppercase tracking-widest mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: banner slider */}
          <div className="lg:col-span-2 hidden lg:block">
            <BannerSlider />
          </div>
        </div>
      </div>
    </section>
  )
}
