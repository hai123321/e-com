import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartSidebar } from '@/components/cart/CartSidebar'
import { PromoBar } from '@/components/layout/PromoBar'
import { FloatingContact } from '@/components/layout/FloatingContact'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <PromoBar />
      {children}
      <Footer />
      <CartSidebar />
      <FloatingContact />
    </>
  )
}
