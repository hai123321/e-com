'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface CategoryItem {
  value: string
  label: string
  icon: string
  href: string
}

const CATEGORIES: CategoryItem[] = [
  { value: 'all',       label: 'Tất cả',           icon: '🛍️', href: '/san-pham' },
  { value: 'AI',        label: 'Thế giới AI',       icon: '🤖', href: '/san-pham?category=AI' },
  { value: 'Streaming', label: 'Giải trí',          icon: '📺', href: '/san-pham?category=Streaming' },
  { value: 'Học tập',   label: 'Học tập',           icon: '📚', href: '/san-pham?category=H%E1%BB%8Dc+t%E1%BA%ADp' },
  { value: 'Thiết kế',  label: 'Edit Ảnh - Video',  icon: '🎨', href: '/san-pham?category=Thi%E1%BA%BFt+k%E1%BA%BF' },
  { value: 'VPN',       label: 'VPN, bảo mật',      icon: '🔒', href: '/san-pham?category=VPN' },
  { value: 'Năng suất', label: 'Làm việc',          icon: '⚡', href: '/san-pham?category=N%C4%83ng+su%E1%BA%A5t' },
  { value: 'Lưu trữ',  label: 'Lưu trữ',           icon: '💾', href: '/san-pham?category=L%C6%B0u+tr%E1%BB%AF' },
  { value: 'Khác',      label: 'Khác',              icon: '📦', href: '/san-pham?category=Kh%C3%A1c' },
]

export function CategorySidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') ?? 'all'

  const isActive = (value: string): boolean => {
    if (value === 'all') {
      return pathname === '/san-pham' && !searchParams.get('category')
    }
    return activeCategory === value
  }

  return (
    <aside className="w-52 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
        <div className="px-4 py-3 bg-primary-600 text-white text-sm font-bold flex items-center gap-2">
          <span>☰</span>
          <span>Danh mục sản phẩm</span>
        </div>
        <ul>
          {CATEGORIES.map((cat) => {
            const active = isActive(cat.value)
            return (
              <li key={cat.value} className="border-b border-gray-50 last:border-0">
                <Link
                  href={cat.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                >
                  <span className="text-lg w-6 text-center">{cat.icon}</span>
                  <span>{cat.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
