'use client'

import { MapPin, Phone, Mail, Send, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/lib/store'

const contactInfo = [
  {
    Icon: MapPin,
    label: 'Địa chỉ',
    value: 'Vinhomes Smart City Tây Mỗ, Nam Từ Liêm, Hà Nội',
  },
  {
    Icon: Phone,
    label: 'Điện thoại',
    value: '038.357.4189',
    href: 'tel:0383574189',
  },
  {
    Icon: Mail,
    label: 'Email',
    value: 'namhai.lsc.ftu@gmail.com',
    href: 'mailto:namhai.lsc.ftu@gmail.com',
  },
  {
    Icon: MessageCircle,
    label: 'Telegram',
    value: '@haitn12',
    href: 'https://t.me/haitn12',
  },
]

export function Contact() {
  const { addToast } = useStore()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    addToast(`Cảm ơn ${name}! Chúng tôi sẽ phản hồi sớm nhất.`, 'success')
    form.reset()
  }

  return (
    <section id="contact" className="py-20 bg-primary-50">
      <div className="section-container">
        {/* Header */}
        <div className="mb-10">
          <div className="section-label">
            <Mail className="w-4 h-4" />
            Liên hệ
          </div>
          <h2 className="section-title">Chúng tôi luôn lắng nghe</h2>
          <p className="section-sub">Mọi thắc mắc hãy liên hệ với chúng tôi, phản hồi trong vòng 30 phút.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
          {/* Info */}
          <div className="card p-8">
            <h3 className="font-bold text-lg text-gray-900 mb-6">Thông tin liên hệ</h3>
            <ul className="space-y-4 mb-8">
              {contactInfo.map(({ Icon, label, value, href }) => (
                <li key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary-700 hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      <div className="text-sm font-semibold text-gray-800">{value}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Zalo QR */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
              <div className="shrink-0">
                {/* Zalo icon */}
                <div className="w-12 h-12 rounded-xl bg-[#0068FF] flex items-center justify-center text-white font-extrabold text-sm tracking-tight">
                  Zalo
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 mb-1">Kết bạn Zalo</p>
                <p className="text-xs text-gray-500 mb-2">Quét mã QR hoặc nhấn để mở Zalo</p>
                <a
                  href="https://zalo.me/0383574189"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#0068FF] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Nhắn tin Zalo →
                </a>
              </div>
            </div>

            <div className="p-4 bg-primary-600 rounded-2xl text-white text-center">
              <p className="text-sm font-semibold mb-1">Hỗ trợ trực tuyến 24/7</p>
              <p className="text-xs text-white/70">Phản hồi nhanh qua Zalo, Telegram</p>
            </div>
          </div>

          {/* Form */}
          <div className="card p-8">
            <h3 className="font-bold text-lg text-gray-900 mb-6">Gửi tin nhắn</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="name"
                type="text"
                placeholder="Họ và tên *"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors"
              />
              <input
                name="email"
                type="email"
                placeholder="Email *"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors"
              />
              <input
                name="subject"
                type="text"
                placeholder="Tiêu đề"
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors"
              />
              <textarea
                name="message"
                rows={4}
                placeholder="Nội dung tin nhắn *"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors resize-none"
              />
              <Button type="submit" size="md" className="w-full">
                <Send className="w-4 h-4" />
                Gửi tin nhắn
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
