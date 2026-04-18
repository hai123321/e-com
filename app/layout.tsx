import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartSidebar } from '@/components/cart/CartSidebar'
import { SessionHydrator } from '@/components/layout/SessionHydrator'
import { PromoBar } from '@/components/layout/PromoBar'
import { FloatingContact } from '@/components/layout/FloatingContact'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Miu Shop – Tài khoản Premium chính hãng',
  description: 'Cung cấp tài khoản Netflix, YouTube, Spotify và các dịch vụ streaming hàng đầu với giá tốt nhất, giao ngay sau thanh toán.',
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
        <SessionHydrator />
        <Header />
        <PromoBar />
        {children}
        <Footer />
        <CartSidebar />
        <ToastContainer />
        <FloatingContact />
      </body>
    </html>
  )
}
