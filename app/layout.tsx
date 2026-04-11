import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/ui/ToastContainer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Miu Shop – Tài khoản Premium chính hãng',
  description:
    'Cung cấp tài khoản Netflix, YouTube, Spotify và các dịch vụ streaming hàng đầu với giá tốt nhất, giao ngay sau thanh toán.',
  keywords: ['netflix', 'spotify', 'youtube premium', 'tài khoản premium', 'miu shop'],
  openGraph: {
    title: 'Miu Shop – Tài khoản Premium',
    description: 'Tài khoản streaming chính hãng, giá tốt, giao ngay.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
