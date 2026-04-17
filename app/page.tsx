import { Hero } from '@/components/sections/Hero'
import { FeaturedProducts } from '@/components/product/FeaturedProducts'
import { Features } from '@/components/sections/Features'
import { Contact } from '@/components/sections/Contact'

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedProducts />
      <Features />
      <Contact />
    </main>
  )
}
