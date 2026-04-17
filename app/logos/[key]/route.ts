import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Serve logo files from public/logos/ at runtime.
 *
 * Next.js standalone mode only serves public/ files that existed at build time.
 * Logos are uploaded after deployment, so we need this route handler to read
 * them from disk dynamically.
 *
 * Handles: GET /logos/{key}.jpg
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } }
) {
  const { key } = params

  // Allow only safe filenames: letters, numbers, hyphens, underscores, one dot + extension
  if (!/^[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(key)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = join(process.cwd(), 'public', 'logos', key)

  try {
    const file = await readFile(filePath)

    const ext = key.split('.').pop()?.toLowerCase()
    const contentType =
      ext === 'png' ? 'image/png' :
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
