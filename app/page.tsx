import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { FeaturedProducts } from '@/components/product/FeaturedProducts'
import { Contact } from '@/components/sections/Contact'

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <FeaturedProducts />
      <Contact />
    </main>
  )
}
