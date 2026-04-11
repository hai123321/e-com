import { Store, Facebook, Instagram, Youtube } from 'lucide-react'

const links = {
  pages: [
    { href: '#', label: 'Trang chủ' },
    { href: '#products', label: 'Sản phẩm' },
    { href: '#contact', label: 'Liên hệ' },
  ],
  policies: [
    { href: '#', label: 'Bảo mật thông tin' },
    { href: '#', label: 'Điều khoản dịch vụ' },
    { href: '#', label: 'Chính sách đổi trả' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-primary-900 to-primary-700 text-white/80">
      <div className="section-container py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-white font-extrabold text-xl mb-3">
              <Store className="w-6 h-6" />
              Miu Shop
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              Cung cấp tài khoản premium chính hãng với giá tốt nhất thị trường. Giao ngay sau thanh toán, hỗ trợ 24/7.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Facebook, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Youtube, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-accent-500 flex items-center justify-center transition-all hover:-translate-y-0.5"
                >
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              {links.pages.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Chính sách</h4>
            <ul className="space-y-2">
              {links.policies.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Miu Shop. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  )
}
