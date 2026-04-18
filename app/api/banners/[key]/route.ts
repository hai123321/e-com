import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Serve banner files from public/banners/ at runtime.
 * Placed under /api/ so Next.js treats it as dynamic (not static build-time).
 *
 * Handles: GET /api/banners/{key}.jpg
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } }
) {
  const { key } = params

  if (!/^[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(key)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = join(process.cwd(), 'public', 'banners', key)

  try {
    const file = await readFile(filePath)
    const ext  = key.split('.').pop()?.toLowerCase()
    const contentType =
      ext === 'png'  ? 'image/png'  :
      ext === 'webp' ? 'image/webp' :
      'image/jpeg'

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
