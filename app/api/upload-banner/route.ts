import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const { bannerId, imageData } = await req.json() as { bannerId: string | number; imageData: string }

    if (!bannerId || !imageData) {
      return NextResponse.json({ error: 'bannerId and imageData required' }, { status: 400 })
    }

    const match = imageData.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    const buffer = Buffer.from(match[2], 'base64')
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
    }

    const dir = join(process.cwd(), 'public', 'banners')
    await mkdir(dir, { recursive: true })

    const filename = `${bannerId}.jpg`
    await writeFile(join(dir, filename), buffer)

    const path = `/banners/${filename}?t=${Date.now()}`
    return NextResponse.json({ success: true, data: { path } })
  } catch (err) {
    console.error('[upload-banner]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
