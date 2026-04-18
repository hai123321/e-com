'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, ShoppingCart, Zap } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useStore } from '@/lib/store'
import { StockBadge } from '@/components/ui/Badge'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import { getServiceConfig } from '@/lib/service-config'
import { apiUrl } from '@/lib/api'

const GROUP_META: Record<string, { name: string; tagline: string }> = {
  chatgpt:       { name: 'ChatGPT',        tagline: 'AI chatbot mạnh nhất của OpenAI' },
  claude:        { name: 'Claude AI',       tagline: 'AI assistant của Anthropic' },
  cursor:        { name: 'Cursor AI',       tagline: 'IDE tích hợp AI cho lập trình viên' },
  perplexity:    { name: 'Perplexity AI',   tagline: 'Công cụ tìm kiếm thông minh' },
  leonardo:      { name: 'Leonardo AI',     tagline: 'Tạo ảnh AI chuyên nghiệp' },
  elevenlabs:    { name: 'ElevenLabs',      tagline: 'Tổng hợp giọng nói AI siêu thực' },
  kling:         { name: 'Kling AI',        tagline: 'Tạo video AI theo văn bản' },
  grok:          { name: 'Grok (xAI)',      tagline: 'AI chatbot của Elon Musk / xAI' },
  krea:          { name: 'KREA AI',         tagline: 'Công cụ sáng tạo hình ảnh AI' },
  veo3:          { name: 'VEO3',            tagline: 'Tạo video AI của Google DeepMind' },
  midjourney:    { name: 'Midjourney',      tagline: 'Tạo ảnh nghệ thuật bằng AI' },
  runway:        { name: 'Runway AI',       tagline: 'Studio video AI sáng tạo' },
  higgsfield:    { name: 'Higgsfield AI',   tagline: 'Tạo video cinematic bằng AI' },
  heygen:        { name: 'HeyGen',          tagline: 'Tạo video avatar AI chuyên nghiệp' },
  hailuo:        { name: 'Hailuo AI',       tagline: 'Tạo video AI của MiniMax' },
  krisp:         { name: 'Krisp',           tagline: 'Lọc tạp âm cuộc họp bằng AI' },
  capcut:        { name: 'CapCut Pro',      tagline: 'Chỉnh sửa video chuyên nghiệp' },
  canva:         { name: 'Canva',           tagline: 'Thiết kế đồ họa trực tuyến' },
  adobe:         { name: 'Adobe',           tagline: 'Bộ công cụ sáng tạo hàng đầu' },
  figma:         { name: 'Figma',           tagline: 'Thiết kế UI/UX cộng tác' },
  lightroom:     { name: 'Lightroom',       tagline: 'Chỉnh sửa ảnh chuyên nghiệp' },
  filmora:       { name: 'Filmora',         tagline: 'Chỉnh sửa video dễ dùng' },
  davinci:       { name: 'DaVinci Resolve', tagline: 'Phần mềm dựng phim chuyên nghiệp' },
  meitu:         { name: 'Meitu SVIP',      tagline: 'Chỉnh sửa ảnh và làm đẹp' },
  picsart:       { name: 'PicsArt',         tagline: 'Chỉnh sửa ảnh sáng tạo' },
  beautifulai:   { name: 'Beautiful.ai',    tagline: 'Tạo slide thuyết trình AI' },
  veed:          { name: 'Veed.io',         tagline: 'Chỉnh sửa video trực tuyến' },
  sketchup:      { name: 'SketchUp',        tagline: 'Thiết kế 3D kiến trúc' },
  corel:         { name: 'CorelDRAW',       tagline: 'Thiết kế đồ họa vector' },
  autocad:       { name: 'AutoCAD',         tagline: 'Vẽ kỹ thuật CAD chuyên nghiệp' },
  autodesk:      { name: 'Autodesk',        tagline: 'Bộ công cụ kỹ thuật Autodesk' },
  retouch4me:    { name: 'Retouch4me',      tagline: 'Retouching ảnh tự động bằng AI' },
  duolingo:      { name: 'Duolingo',        tagline: 'Học ngoại ngữ vui và hiệu quả' },
  elsa:          { name: 'ELSA Speak',      tagline: 'Luyện phát âm tiếng Anh' },
  grammarly:     { name: 'Grammarly',       tagline: 'Kiểm tra ngữ pháp và viết lách' },
  ejoy:          { name: 'Ejoy English',    tagline: 'Học tiếng Anh qua phim' },
  quillbot:      { name: 'QuillBot',        tagline: 'Viết lại văn bản thông minh' },
  memrise:       { name: 'Memrise',         tagline: 'Học từ vựng theo phương pháp ghi nhớ' },
  hellochinese:  { name: 'HelloChinese',    tagline: 'Học tiếng Trung từ cơ bản' },
  quizlet:       { name: 'Quizlet',         tagline: 'Học và ôn tập qua flashcard' },
  codecademy:    { name: 'Codecademy',      tagline: 'Học lập trình tương tác' },
  studocu:       { name: 'Studocu',         tagline: 'Tài liệu học tập và ghi chú' },
  datacamp:      { name: 'DataCamp',        tagline: 'Học data science và lập trình' },
  coursera:      { name: 'Coursera',        tagline: 'Khóa học từ đại học hàng đầu' },
  skillshare:    { name: 'Skillshare',      tagline: 'Học kỹ năng sáng tạo' },
  udemy:         { name: 'Udemy',           tagline: 'Khóa học online đa dạng' },
  chegg:         { name: 'Chegg',           tagline: 'Hỗ trợ học tập và giải bài tập' },
  kahoot:        { name: 'Kahoot!',         tagline: 'Học qua trò chơi tương tác' },
  wordwall:      { name: 'Wordwall',        tagline: 'Tạo trò chơi học tập' },
  leetcode:      { name: 'LeetCode',        tagline: 'Luyện thuật toán và phỏng vấn' },
  quizizz:       { name: 'Quizizz',         tagline: 'Quiz học tập tương tác' },
  scribd:        { name: 'Scribd',          tagline: 'Thư viện tài liệu và audiobook' },
  busuu:         { name: 'Busuu',           tagline: 'Học ngôn ngữ cùng cộng đồng' },
  netflix:       { name: 'Netflix',         tagline: 'Xem phim và series hàng đầu' },
  youtube:       { name: 'YouTube Premium', tagline: 'YouTube không quảng cáo + nhạc' },
  spotify:       { name: 'Spotify',         tagline: 'Nghe nhạc không giới hạn' },
  'apple-music': { name: 'Apple Music',     tagline: 'Nghe nhạc lossless chất lượng cao' },
  tidal:         { name: 'Tidal',           tagline: 'Nhạc Hi-Fi và HiRes Audio' },
  'galaxy-play': { name: 'Galaxy Play',     tagline: 'Xem phim Việt và quốc tế' },
  tv360:         { name: 'TV360',           tagline: 'Truyền hình OTT của Viettel' },
  vtvcab:        { name: 'VTVCab ON',       tagline: 'Kênh truyền hình VTV và VTVCab' },
  youku:         { name: 'Youku VIP',       tagline: 'Xem phim và nội dung Trung Quốc' },
  'fpt-play':    { name: 'FPT Play',        tagline: 'Xem bóng đá và phim trực tuyến' },
  iqiyi:         { name: 'iQIYI VIP',       tagline: 'Xem phim và series Trung Quốc' },
  vieon:         { name: 'Vieon',           tagline: 'Xem phim Việt - Hàn - HBO' },
  notion:        { name: 'Notion',          tagline: 'Không gian làm việc all-in-one' },
  office365:     { name: 'Office 365',      tagline: 'Bộ ứng dụng Microsoft Office' },
  copilot:       { name: 'Copilot Pro',     tagline: 'AI assistant tích hợp Office' },
  zoom:          { name: 'Zoom Pro',        tagline: 'Họp trực tuyến chuyên nghiệp' },
  gamma:         { name: 'Gamma',           tagline: 'Tạo slide và trang web bằng AI' },
  turnitin:      { name: 'Turnitin',        tagline: 'Kiểm tra đạo văn học thuật' },
  'google-meet': { name: 'Google Meet',     tagline: 'Họp video miễn phí của Google' },
  tradingview:   { name: 'TradingView',     tagline: 'Phân tích kỹ thuật chứng khoán' },
  camscanner:    { name: 'CamScanner',      tagline: 'Scan tài liệu bằng điện thoại' },
  jetbrains:     { name: 'JetBrains',       tagline: 'IDE chuyên nghiệp cho lập trình' },
  linkedin:      { name: 'LinkedIn',        tagline: 'Mạng xã hội nghề nghiệp' },
  gemini:        { name: 'Gemini',          tagline: 'AI của Google + Google One' },
  'google-one':  { name: 'Google One',      tagline: 'Dung lượng Google Drive gia đình' },
  onedrive:      { name: 'OneDrive',        tagline: 'Lưu trữ đám mây Microsoft' },
  dropbox:       { name: 'Dropbox',         tagline: 'Lưu trữ và chia sẻ file' },
  icloud:        { name: 'iCloud',          tagline: 'Lưu trữ đám mây Apple' },
  nordvpn:       { name: 'NordVPN',         tagline: 'VPN bảo mật hàng đầu thế giới' },
  expressvpn:    { name: 'ExpressVPN',      tagline: 'VPN tốc độ cao đa quốc gia' },
  pia:           { name: 'PIA VPN',         tagline: 'VPN bảo mật Private Internet Access' },
  hma:           { name: 'HMA VPN',         tagline: 'Hide My Ass - VPN đa thiết bị' },
  'hotspot-shield': { name: 'Hotspot Shield', tagline: 'VPN nhanh và bảo mật' },
  lastpass:      { name: 'LastPass',        tagline: 'Quản lý mật khẩu an toàn' },
  '1password':   { name: '1Password',       tagline: 'Quản lý mật khẩu cao cấp' },
  kaspersky:     { name: 'Kaspersky',       tagline: 'Bảo mật và diệt virus' },
  windows:       { name: 'Windows',         tagline: 'Bản quyền Windows 10/11 Pro' },
  vietmap:       { name: 'Vietmap',         tagline: 'Bản đồ và dẫn đường Việt Nam' },
  chess:         { name: 'Chess.com',       tagline: 'Học và chơi cờ vua trực tuyến' },
  discord:       { name: 'Discord Nitro',   tagline: 'Nâng cấp Discord server và emoji' },
  tinder:        { name: 'Tinder',          tagline: 'Ứng dụng hẹn hò Gold/Platinum' },
  bumble:        { name: 'Bumble',          tagline: 'Kết nối và hẹn hò an toàn' },
}

export { GROUP_META }

function extractDurationDays(name: string, description: string): number {
  const text = name + ' ' + description
  const monthMatch = text.match(/(\d+)\s*tháng/)
  const dayMatch = text.match(/(\d+)\s*ngày/)
  if (monthMatch) return parseInt(monthMatch[1]) * 30
  if (dayMatch) return parseInt(dayMatch[1])
  return 30
}

function extractFeatures(description: string): string[] {
  return description
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 3)
}

export default function ProductDetailClient({ slug }: { slug: string }) {
  const { addItem, items } = useStore()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Product | null>(null)
  const [heroImgErr, setHeroImgErr] = useState(false)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const meta = GROUP_META[slug] ?? { name: slug, tagline: '' }

  useEffect(() => {
    fetch(apiUrl(`/products/group/${slug}`), { signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((json) => {
        const list: Product[] = json.data ?? []
        setProducts(list)
        setSelected(list[0] ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    cardRefs.current.forEach((el) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('pricing-card-visible')
            obs.disconnect()
          }
        },
        { threshold: 0.1 },
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [products.length])

  const svc = getServiceConfig(meta.name, products[0]?.category)

  const tiersWithMeta = products.map((p) => {
    const days = extractDurationDays(p.name, p.description)
    return { product: p, days, pricePerDay: p.price / days }
  })

  const cheapestPricePerDay = tiersWithMeta.length
    ? Math.min(...tiersWithMeta.map((t) => t.pricePerDay))
    : 0
  const highestStockId = products.length
    ? products.reduce((a, b) => (a.stock >= b.stock ? a : b)).id
    : null

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-primary-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </main>
    )
  }

  if (!products.length) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-primary-50">
        <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm.</p>
        <Link href="/" className="text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
      </main>
    )
  }

  const heroImage = products[0]?.image
  const selectedStatus = selected ? getStockStatus(selected.stock) : 'out'
  const inCart = selected ? items.find((i) => i.product.id === selected.id) : null

  return (
    <main className="min-h-screen bg-primary-50">
      <style>{`
        .pricing-card {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .pricing-card-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="section-container py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">{meta.name}</span>
          </nav>
        </div>
      </div>

      <div className="section-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left — Brand hero */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden sticky top-24">
              <div className={`relative h-56 bg-gradient-to-br ${svc.bg} flex items-center justify-center`}>
                {heroImage && !heroImgErr ? (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white/10 shadow-xl">
                    <Image src={heroImage} alt={meta.name} fill className="object-contain p-3"
                      unoptimized
                      onError={() => setHeroImgErr(true)} sizes="112px" />
                  </div>
                ) : (
                  <span className="text-7xl">{svc.icon}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
                    {products[0]?.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{meta.name}</h1>
                <p className="text-sm text-gray-500 mb-5">{meta.tagline}</p>

                {/* Selected variant summary */}
                {selected && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-5">
                    <p className="text-xs text-primary-600 font-semibold mb-1">Gói đã chọn</p>
                    <p className="font-bold text-gray-800 text-sm leading-snug">{selected.name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xl font-extrabold text-primary-700">
                        {formatCurrency(selected.price)}
                      </span>
                      <StockBadge status={selectedStatus} />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => selected && addItem(selected)}
                  disabled={!selected || selectedStatus === 'out'}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-bold rounded-xl px-6 py-3.5 transition-all hover:shadow-lg hover:shadow-primary-200 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {!selected || selectedStatus === 'out'
                    ? 'Hết hàng'
                    : inCart
                      ? `Trong giỏ (${inCart.qty}) — Thêm nữa`
                      : 'Thêm vào giỏ hàng'}
                </button>

                <Link
                  href="/"
                  className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Xem thêm sản phẩm khác
                </Link>
              </div>
            </div>
          </div>

          {/* Right — Pricing card grid */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              Chọn gói phù hợp
              <span className="ml-2 text-sm font-normal text-gray-400">({products.length} gói)</span>
            </h2>

            <div
              className={`grid gap-4 ${
                products.length === 1
                  ? 'grid-cols-1'
                  : products.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
              }`}
            >
              {tiersWithMeta.map(({ product: p, days, pricePerDay }, idx) => {
                const st = getStockStatus(p.stock)
                const isSelected = selected?.id === p.id
                const isOut = st === 'out'
                const isCheapest =
                  Math.abs(pricePerDay - cheapestPricePerDay) < 0.01 && products.length > 1
                const isPopular = p.id === highestStockId && products.length > 1
                const features = extractFeatures(p.description)

                return (
                  <div
                    key={p.id}
                    ref={(el) => { cardRefs.current[idx] = el }}
                    className="pricing-card"
                    style={{ transitionDelay: `${idx * 80}ms` }}
                  >
                    <div
                      onClick={() => !isOut && setSelected(p)}
                      className={`relative h-full flex flex-col rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-500 shadow-lg shadow-primary-100 bg-white'
                          : isOut
                            ? 'border-gray-100 opacity-50 cursor-not-allowed bg-gray-50'
                            : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-white cursor-pointer'
                      } ${isPopular && !isOut ? 'ring-2 ring-primary-400 ring-offset-2' : ''}`}
                    >
                      {/* Badges */}
                      {(isPopular || isCheapest) && !isOut && (
                        <div className="absolute -top-3 left-4 flex gap-2">
                          {isPopular && (
                            <span className="inline-flex items-center gap-1 bg-primary-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                              <Zap className="w-2.5 h-2.5" /> Phổ biến nhất
                            </span>
                          )}
                          {isCheapest && !isPopular && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                              Tiết kiệm nhất
                            </span>
                          )}
                          {isCheapest && isPopular && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                              Tiết kiệm nhất
                            </span>
                          )}
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col">
                        {/* Name */}
                        <h3 className={`font-bold text-sm leading-snug mb-3 ${
                          isSelected ? 'text-primary-700' : 'text-gray-800'
                        }`}>
                          {p.name}
                        </h3>

                        {/* Price */}
                        <div className="mb-4">
                          <span className={`text-2xl font-extrabold ${
                            isSelected ? 'text-primary-600' : 'text-gray-900'
                          }`}>
                            {formatCurrency(p.price)}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {days >= 30
                              ? `${days / 30} tháng · ${formatCurrency(Math.round(pricePerDay))}/ngày`
                              : `${days} ngày · ${formatCurrency(Math.round(pricePerDay))}/ngày`}
                          </p>
                        </div>

                        {/* Features */}
                        <ul className="flex-1 flex flex-col gap-1.5 mb-4">
                          {features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{feat}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Stock */}
                        <div className="flex items-center justify-between mb-3">
                          <StockBadge status={st} />
                          {!isOut && (
                            <span className="text-xs text-gray-400">{p.stock} còn lại</span>
                          )}
                        </div>

                        {/* Buy button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isOut) addItem(p)
                          }}
                          disabled={isOut}
                          className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all ${
                            isOut
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow'
                                : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {isOut
                            ? 'Hết hàng'
                            : items.find((i) => i.product.id === p.id)
                              ? 'Thêm nữa'
                              : 'Thêm vào giỏ'
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
