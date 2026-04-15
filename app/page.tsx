import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { Contact } from '@/components/sections/Contact'
import { ProductGrid } from '@/components/product/ProductGrid'

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <ProductGrid />
      <Contact />
    </main>
  )
}
