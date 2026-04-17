import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import pg from 'pg'
import 'dotenv/config'
import { products } from '../src/db/schema.js'

// Taglines mirrored from app/san-pham/[slug]/page.tsx GROUP_META.
const GROUP_TAGLINES: Record<string, string> = {
  chatgpt:         'AI chatbot mạnh nhất của OpenAI',
  claude:          'AI assistant của Anthropic',
  cursor:          'IDE tích hợp AI cho lập trình viên',
  perplexity:      'Công cụ tìm kiếm thông minh',
  leonardo:        'Tạo ảnh AI chuyên nghiệp',
  elevenlabs:      'Tổng hợp giọng nói AI siêu thực',
  kling:           'Tạo video AI theo văn bản',
  grok:            'AI chatbot của Elon Musk / xAI',
  krea:            'Công cụ sáng tạo hình ảnh AI',
  veo3:            'Tạo video AI của Google DeepMind',
  midjourney:      'Tạo ảnh nghệ thuật bằng AI',
  runway:          'Studio video AI sáng tạo',
  higgsfield:      'Tạo video cinematic bằng AI',
  heygen:          'Tạo video avatar AI chuyên nghiệp',
  hailuo:          'Tạo video AI của MiniMax',
  krisp:           'Lọc tạp âm cuộc họp bằng AI',
  capcut:          'Chỉnh sửa video chuyên nghiệp',
  canva:           'Thiết kế đồ họa trực tuyến',
  adobe:           'Bộ công cụ sáng tạo hàng đầu',
  figma:           'Thiết kế UI/UX cộng tác',
  lightroom:       'Chỉnh sửa ảnh chuyên nghiệp',
  filmora:         'Chỉnh sửa video dễ dùng',
  davinci:         'Phần mềm dựng phim chuyên nghiệp',
  meitu:           'Chỉnh sửa ảnh và làm đẹp',
  picsart:         'Chỉnh sửa ảnh sáng tạo',
  beautifulai:     'Tạo slide thuyết trình AI',
  veed:            'Chỉnh sửa video trực tuyến',
  sketchup:        'Thiết kế 3D kiến trúc',
  corel:           'Thiết kế đồ họa vector',
  autocad:         'Vẽ kỹ thuật CAD chuyên nghiệp',
  autodesk:        'Bộ công cụ kỹ thuật Autodesk',
  retouch4me:      'Retouching ảnh tự động bằng AI',
  duolingo:        'Học ngoại ngữ vui và hiệu quả',
  elsa:            'Luyện phát âm tiếng Anh',
  grammarly:       'Kiểm tra ngữ pháp và viết lách',
  ejoy:            'Học tiếng Anh qua phim',
  quillbot:        'Viết lại văn bản thông minh',
  memrise:         'Học từ vựng theo phương pháp ghi nhớ',
  hellochinese:    'Học tiếng Trung từ cơ bản',
  quizlet:         'Học và ôn tập qua flashcard',
  codecademy:      'Học lập trình tương tác',
  studocu:         'Tài liệu học tập và ghi chú',
  datacamp:        'Học data science và lập trình',
  coursera:        'Khóa học từ đại học hàng đầu',
  skillshare:      'Học kỹ năng sáng tạo',
  udemy:           'Khóa học online đa dạng',
  chegg:           'Hỗ trợ học tập và giải bài tập',
  kahoot:          'Học qua trò chơi tương tác',
  wordwall:        'Tạo trò chơi học tập',
  leetcode:        'Luyện thuật toán và phỏng vấn',
  quizizz:         'Quiz học tập tương tác',
  scribd:          'Thư viện tài liệu và audiobook',
  busuu:           'Học ngôn ngữ cùng cộng đồng',
  netflix:         'Xem phim và series hàng đầu',
  youtube:         'YouTube không quảng cáo + nhạc',
  spotify:         'Nghe nhạc không giới hạn',
  'apple-music':   'Nghe nhạc lossless chất lượng cao',
  tidal:           'Nhạc Hi-Fi và HiRes Audio',
  'galaxy-play':   'Xem phim Việt và quốc tế',
  tv360:           'Truyền hình OTT của Viettel',
  vtvcab:          'Kênh truyền hình VTV và VTVCab',
  youku:           'Xem phim và nội dung Trung Quốc',
  'fpt-play':      'Xem bóng đá và phim trực tuyến',
  iqiyi:           'Xem phim và series Trung Quốc',
  vieon:           'Xem phim Việt - Hàn - HBO',
  notion:          'Không gian làm việc all-in-one',
  office365:       'Bộ ứng dụng Microsoft Office',
  copilot:         'AI assistant tích hợp Office',
  zoom:            'Họp trực tuyến chuyên nghiệp',
  gamma:           'Tạo slide và trang web bằng AI',
  turnitin:        'Kiểm tra đạo văn học thuật',
  'google-meet':   'Họp video miễn phí của Google',
  tradingview:     'Phân tích kỹ thuật chứng khoán',
  camscanner:      'Scan tài liệu bằng điện thoại',
  jetbrains:       'IDE chuyên nghiệp cho lập trình',
  linkedin:        'Mạng xã hội nghề nghiệp',
  gemini:          'AI của Google + Google One',
  'google-one':    'Dung lượng Google Drive gia đình',
  onedrive:        'Lưu trữ đám mây Microsoft',
  dropbox:         'Lưu trữ và chia sẻ file',
  icloud:          'Lưu trữ đám mây Apple',
  nordvpn:         'VPN bảo mật hàng đầu thế giới',
  expressvpn:      'VPN tốc độ cao đa quốc gia',
  pia:             'VPN bảo mật Private Internet Access',
  hma:             'Hide My Ass - VPN đa thiết bị',
  'hotspot-shield': 'VPN nhanh và bảo mật',
  lastpass:        'Quản lý mật khẩu an toàn',
  '1password':     'Quản lý mật khẩu cao cấp',
  kaspersky:       'Bảo mật và diệt virus',
  windows:         'Bản quyền Windows 10/11 Pro',
  vietmap:         'Bản đồ và dẫn đường Việt Nam',
  chess:           'Học và chơi cờ vua trực tuyến',
  discord:         'Nâng cấp Discord server và emoji',
  tinder:          'Ứng dụng hẹn hò Gold/Platinum',
  bumble:          'Kết nối và hẹn hò an toàn',
}

export function buildDescription(name: string, groupKey: string): string {
  const n = name.toLowerCase()

  // Duration
  const dur =
    n.includes('1 năm') ? '1 năm' :
    n.includes('6 tháng') ? '6 tháng' :
    n.includes('3 tháng') ? '3 tháng' :
    n.includes('1 tháng') ? '1 tháng' : ''
  const durText = dur ? `Thời hạn sử dụng ${dur}.` : ''

  // Account type
  const isPrivate  = n.includes('cấp sẵn') || n.includes('dùng riêng')
  const isOwn      = n.includes('chính chủ')
  const isShared   = n.includes('dùng chung')
  const isTeam     = n.includes('team') || n.includes('add team')
  const isLink     = n.includes('grab link') || n.includes('link nâng cấp')
  const isNoWarr   = n.includes('không bảo hành')

  const tagline = GROUP_TAGLINES[groupKey] ?? ''

  let typeDesc = ''
  if (isTeam)         typeDesc = 'Thêm vào Team/Group workspace của shop, không ảnh hưởng dữ liệu cũ.'
  else if (isLink)    typeDesc = 'Link nâng cấp trực tiếp — áp dụng cho tài khoản chưa từng nâng gói.'
  else if (isPrivate) typeDesc = 'Tài khoản cấp sẵn dùng riêng, không chia sẻ với ai.'
  else if (isOwn)     typeDesc = 'Nâng cấp trực tiếp tài khoản của bạn, giữ nguyên dữ liệu và lịch sử.'
  else if (isShared)  typeDesc = 'Tài khoản dùng chung, phù hợp nhu cầu cơ bản, giá tiết kiệm.'

  const warranty = isNoWarr
    ? 'Không kèm bảo hành.'
    : 'Bảo hành đúng thời hạn, hỗ trợ 24/7 qua Zalo.'

  return [tagline, typeDesc, durText, warranty].filter(Boolean).join(' ')
}

async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  const all = await db.select().from(products)
  let updated = 0

  for (const p of all) {
    if ((p.description ?? '').length >= 30) continue
    const next = buildDescription(p.name, p.groupKey)
    if (!next) continue
    await db.update(products).set({ description: next }).where(eq(products.id, p.id))
    updated += 1
  }

  console.log(`updated ${updated} products`)
  await pool.end()
  process.exit(0)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
