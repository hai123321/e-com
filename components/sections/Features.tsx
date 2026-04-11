import { ShieldCheck, Zap, Headphones, RefreshCw } from 'lucide-react'

const features = [
  {
    Icon: ShieldCheck,
    title: 'Chính hãng 100%',
    desc: 'Tất cả tài khoản được kiểm duyệt kỹ lưỡng, đảm bảo hoạt động ổn định.',
  },
  {
    Icon: Zap,
    title: 'Giao ngay tức thì',
    desc: 'Thông tin tài khoản gửi ngay sau khi thanh toán thành công.',
  },
  {
    Icon: Headphones,
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc bất cứ lúc nào.',
  },
  {
    Icon: RefreshCw,
    title: 'Đổi trả dễ dàng',
    desc: 'Cam kết đổi trả ngay nếu tài khoản không hoạt động trong 24 giờ.',
  },
]

export function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="section-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="group card p-6 text-center hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-primary-100 group-hover:bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                <Icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
