import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { Contact } from '@/components/sections/Contact'
import { ProductGrid } from '@/components/product/ProductGrid'
import { CartSidebar } from '@/components/cart/CartSidebar'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <ProductGrid />
        <Contact />
      </main>
      <Footer />
      <CartSidebar />
    </>
  )
}
