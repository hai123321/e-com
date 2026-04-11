import { Zap, ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const stats = [
  { value: '10K+', label: 'Khách hàng' },
  { value: '99%',  label: 'Hài lòng'   },
  { value: '24/7', label: 'Hỗ trợ'     },
  { value: '100%', label: 'Chính hãng' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 py-24 lg:py-32">
      {/* Background blobs */}
      <div className="hero-blob w-96 h-96 bg-white/5 -top-24 -left-24" />
      <div className="hero-blob w-72 h-72 bg-accent-500/10 bottom-0 right-0" />

      <div className="section-container relative z-10">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-white text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-accent-400" />
            Tin cậy bởi 10,000+ khách hàng
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-5">
            Tài khoản{' '}
            <span className="text-accent-400">Premium</span>
            <br />
            giá tốt nhất
          </h1>

          <p className="text-white/75 text-lg mb-8 leading-relaxed">
            Netflix, Spotify, YouTube và hơn 20 dịch vụ streaming hàng đầu thế giới.
            Giao ngay sau thanh toán, hỗ trợ đổi trả 24 giờ.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4">
            <a href="#products">
              <Button size="lg" variant="primary" className="shadow-lg shadow-accent-500/30">
                <Zap className="w-5 h-5" />
                Mua ngay
              </Button>
            </a>
            <a href="#contact">
              <Button size="lg" variant="outline">
                Tư vấn miễn phí
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-12 pt-10 border-t border-white/10">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-white/50 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
