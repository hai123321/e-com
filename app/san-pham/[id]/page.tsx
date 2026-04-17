import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductDetailClient } from '@/components/product/ProductDetailClient'

interface Props {
  params: { id: string }
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-primary-50 py-12">
        <div className="section-container max-w-4xl">
          <ProductDetailClient id={params.id} />
        </div>
      </main>
      <Footer />
    </>
  )
}
