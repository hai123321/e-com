'use client'

import { MapPin, Phone, Mail, Send, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/lib/store'

const contactInfo = [
  { Icon: MapPin,         label: 'Địa chỉ',    value: '123 Đường ABC, Q.XYZ, TP.HCM' },
  { Icon: Phone,          label: 'Điện thoại', value: '0123 456 789'                  },
  { Icon: Mail,           label: 'Email',       value: 'info@miushop.com'              },
  { Icon: MessageCircle,  label: 'Telegram',    value: '@miushop'                      },
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
              {contactInfo.map(({ Icon, label, value }) => (
                <li key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                    <div className="text-sm font-semibold text-gray-800">{value}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="p-4 bg-primary-600 rounded-2xl text-white text-center">
              <p className="text-sm font-semibold mb-1">Hỗ trợ trực tuyến 24/7</p>
              <p className="text-xs text-white/70">Phản hồi nhanh qua Telegram @miushop</p>
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
