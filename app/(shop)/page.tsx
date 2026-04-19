export const revalidate = 60

import { Hero } from '@/components/sections/Hero'
import { TrustBar } from '@/components/sections/TrustBar'
import { FeaturedProducts } from '@/components/product/FeaturedProducts'
import { Features } from '@/components/sections/Features'
import { Contact } from '@/components/sections/Contact'

export default function Home() {
  return (
    <main>
      <Hero />
      <TrustBar />
      <FeaturedProducts />
      <Features />
      <Contact />
    </main>
  )
}
