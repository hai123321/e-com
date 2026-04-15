import type { Metadata } from 'next'
import { BookOpen, ShoppingCart, CreditCard, Clock, Shield, HeadphonesIcon, ChevronDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Hướng dẫn & FAQ | Miu Shop',
  description: 'Hướng dẫn mua hàng, kích hoạt tài khoản và giải đáp các câu hỏi thường gặp tại Miu Shop.',
}

interface FaqItem {
  q: string
  a: string
}

interface Section {
  icon: React.ReactNode
  title: string
  color: string
  items: FaqItem[]
}

const FAQ_SECTIONS: Section[] = [
  {
    icon: <ShoppingCart className="w-5 h-5" />,
    title: 'Đặt hàng & Thanh toán',
    color: 'bg-blue-50 border-blue-200',
    items: [
      {
        q: 'Làm thế nào để đặt mua tài khoản?',
        a: 'Chọn sản phẩm → Nhấn "Thêm vào giỏ" → Vào giỏ hàng → Điền thông tin liên hệ → Thanh toán. Sau khi xác nhận thanh toán, chúng tôi sẽ gửi thông tin tài khoản qua Zalo/Messenger trong vòng 5–30 phút.',
      },
      {
        q: 'Có những hình thức thanh toán nào?',
        a: 'Chúng tôi chấp nhận chuyển khoản ngân hàng, MoMo, ZaloPay và ViettelMoney. Thông tin tài khoản thanh toán sẽ hiển thị khi đặt hàng.',
      },
      {
        q: 'Có thể mua số lượng nhiều không?',
        a: 'Có. Bạn có thể thêm nhiều sản phẩm vào giỏ hoặc liên hệ trực tiếp qua Zalo để được báo giá sỉ ưu đãi hơn.',
      },
      {
        q: 'Có cần tạo tài khoản trên web không?',
        a: 'Không cần. Bạn chỉ cần cung cấp thông tin liên hệ (Zalo/Messenger) khi đặt hàng để nhận thông tin tài khoản.',
      },
    ],
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Giao hàng & Kích hoạt',
    color: 'bg-green-50 border-green-200',
    items: [
      {
        q: 'Bao lâu nhận được tài khoản sau khi thanh toán?',
        a: 'Thông thường từ 5 đến 30 phút sau khi thanh toán được xác nhận. Trong giờ cao điểm có thể mất đến 1 giờ. Chúng tôi hoạt động từ 8:00–23:00 hằng ngày.',
      },
      {
        q: 'Tài khoản được giao dưới dạng nào?',
        a: 'Chúng tôi cung cấp email và mật khẩu (hoặc link kích hoạt tuỳ dịch vụ) qua Zalo/Messenger. Một số dịch vụ cần đăng nhập bằng Google/Apple — bạn sẽ nhận đủ thông tin để truy cập.',
      },
      {
        q: 'Làm sao kích hoạt Netflix / YouTube Premium?',
        a: 'Đăng nhập bằng email và mật khẩu được cung cấp tại netflix.com hoặc youtube.com. Với Netflix, chọn profile tên bạn (hoặc profile trống) — không được đổi mật khẩu chính. Với YouTube Premium, truy cập youtube.com/premium để xác nhận đặc quyền.',
      },
      {
        q: 'Làm sao kích hoạt ChatGPT Plus / Claude Pro?',
        a: 'Đăng nhập tại chat.openai.com hoặc claude.ai bằng tài khoản được cung cấp. Gói Plus/Pro đã được kích hoạt sẵn — bạn có thể dùng ngay GPT-4, DALL·E hoặc Claude Sonnet/Opus.',
      },
      {
        q: 'Làm sao kích hoạt Duolingo Plus / Coursera?',
        a: 'Đăng nhập bằng email + mật khẩu được cung cấp. Duolingo: tắt quảng cáo và luyện offline tự động sau khi đăng nhập. Coursera: vào Enrollments → chọn khoá học cần học với tư cách Financial Aid hoặc dùng tài khoản Plus đã enroll sẵn.',
      },
    ],
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Bảo hành & Đổi trả',
    color: 'bg-purple-50 border-purple-200',
    items: [
      {
        q: 'Tài khoản có bảo hành không?',
        a: 'Có. Tất cả tài khoản được bảo hành trong thời gian sử dụng còn lại: nếu tài khoản bị lỗi, hết hạn sớm hơn dự kiến hoặc không truy cập được, chúng tôi sẽ đổi tài khoản mới miễn phí.',
      },
      {
        q: 'Khi nào KHÔNG được bảo hành?',
        a: 'Không bảo hành nếu: bạn tự đổi mật khẩu/email chính, vi phạm điều khoản của nhà cung cấp, hoặc chia sẻ thông tin đăng nhập ra ngoài. Vui lòng không đổi thông tin tài khoản chính.',
      },
      {
        q: 'Nếu tài khoản bị đổi mật khẩu hoặc bị lỗi phải làm gì?',
        a: 'Nhắn tin ngay cho chúng tôi qua Zalo/Messenger kèm thông tin đơn hàng. Chúng tôi sẽ kiểm tra và cấp lại tài khoản trong vòng 30 phút (trong giờ làm việc).',
      },
      {
        q: 'Có hoàn tiền không?',
        a: 'Có hoàn tiền 100% nếu chúng tôi không cung cấp được tài khoản sau 24 giờ kể từ khi thanh toán. Không hoàn tiền sau khi đã giao và sử dụng thành công.',
      },
    ],
  },
  {
    icon: <HeadphonesIcon className="w-5 h-5" />,
    title: 'Hỗ trợ kỹ thuật',
    color: 'bg-orange-50 border-orange-200',
    items: [
      {
        q: 'Netflix báo "Đã đạt giới hạn thiết bị" phải làm sao?',
        a: 'Vào Cài đặt tài khoản → Quản lý quyền truy cập → Đăng xuất khỏi tất cả thiết bị → Đăng nhập lại. Nếu vẫn lỗi, nhắn cho chúng tôi để được hỗ trợ.',
      },
      {
        q: 'YouTube Premium không hiển thị đặc quyền?',
        a: 'Thử xoá cache trình duyệt hoặc dùng tab ẩn danh. Trên mobile, vào Cài đặt app → Xoá cache → Mở lại. Đảm bảo đang đăng nhập đúng tài khoản được cung cấp.',
      },
      {
        q: 'ChatGPT vẫn dùng GPT-3.5 dù đã Plus?',
        a: 'Trên giao diện chat, nhấn vào tên model ở góc trên → chọn GPT-4o hoặc GPT-4. Nếu không thấy option này, thử đăng xuất và đăng nhập lại.',
      },
      {
        q: 'Duolingo vẫn hiện quảng cáo?',
        a: 'Đảm bảo đang đăng nhập đúng tài khoản. Trên app, vào Profile → Settings → Subscription để xác nhận gói Plus đang hoạt động. Nếu chưa hiện, tắt app và mở lại.',
      },
      {
        q: 'Capcut Pro không mở được tính năng xuất 4K?',
        a: 'Đảm bảo dùng đúng tài khoản được cung cấp. Một số tính năng Pro cần cập nhật app lên phiên bản mới nhất. Vào App Store/Play Store để cập nhật.',
      },
    ],
  },
]

export default function HuongDanPage() {
  return (
    <main className="min-h-screen bg-primary-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-16">
        <div className="section-container">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-accent-300" />
            <span className="text-accent-300 font-semibold text-sm uppercase tracking-wider">Hướng dẫn</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Hướng dẫn & Câu hỏi thường gặp</h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Tất cả thông tin bạn cần để đặt hàng, kích hoạt và sử dụng tài khoản Premium một cách suôn sẻ.
          </p>
        </div>
      </div>

      {/* Quick steps */}
      <div className="section-container py-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Quy trình mua hàng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {[
            { step: '01', title: 'Chọn sản phẩm', desc: 'Duyệt danh mục và thêm vào giỏ hàng', icon: '🛒' },
            { step: '02', title: 'Thanh toán', desc: 'Chuyển khoản/MoMo/ZaloPay nhanh chóng', icon: '💳' },
            { step: '03', title: 'Nhận tài khoản', desc: 'Giao qua Zalo/Messenger trong 5–30 phút', icon: '📲' },
            { step: '04', title: 'Sử dụng ngay', desc: 'Đăng nhập và tận hưởng dịch vụ Premium', icon: '🚀' },
          ].map((s) => (
            <div key={s.step} className="card p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-bold text-primary-500 bg-primary-100 px-2.5 py-1 rounded-full">
                  Bước {s.step}
                </span>
              </div>
              <h3 className="font-bold text-gray-800">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ sections */}
        <h2 className="text-xl font-bold text-gray-800 mb-6">Câu hỏi thường gặp</h2>
        <div className="flex flex-col gap-8">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 mb-4 w-fit ${section.color}`}>
                {section.icon}
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
          <h3 className="text-xl font-bold mb-2">Vẫn còn thắc mắc?</h3>
          <p className="text-white/70 mb-6">Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp bạn 8:00–23:00 mỗi ngày.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors"
            >
              💬 Nhắn tin ngay
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-colors"
            >
              🛍️ Xem sản phẩm
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
