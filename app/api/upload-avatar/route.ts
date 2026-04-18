import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const { userId, imageData } = await req.json() as { userId: number; imageData: string }

    if (!userId || !imageData) {
      return NextResponse.json({ error: 'userId and imageData required' }, { status: 400 })
    }

    // Validate base64 image
    const match = imageData.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }
    const buffer = Buffer.from(match[2], 'base64')
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 })
    }

    const avatarsDir = join(process.cwd(), 'public', 'avatars')
    await mkdir(avatarsDir, { recursive: true })

    const filename = `${userId}.jpg`
    const filePath = join(avatarsDir, filename)
    await writeFile(filePath, buffer)

    const path = `/avatars/${filename}?t=${Date.now()}`
    return NextResponse.json({ success: true, data: { path } })
  } catch (err) {
    console.error('[upload-avatar]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
