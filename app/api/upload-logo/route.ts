import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const GROUP_KEY_RE = /^[a-z0-9_-]+$/

export async function POST(req: NextRequest) {
  // Validate admin token by hitting the backend
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const apiBase = process.env.API_INTERNAL_URL ?? 'http://api:3001'
  const check = await fetch(`${apiBase}/api/v1/admin/orders?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)

  if (!check || check.status === 401 || check.status === 403) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { groupKey, imageData } = (body ?? {}) as { groupKey?: string; imageData?: string }

  if (!groupKey || !imageData) {
    return NextResponse.json({ success: false, error: 'groupKey and imageData required' }, { status: 400 })
  }
  if (!GROUP_KEY_RE.test(groupKey)) {
    return NextResponse.json({ success: false, error: 'Invalid groupKey format' }, { status: 400 })
  }

  // Strip data URL prefix
  const base64 = imageData.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')

  if (buffer.length > 2 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: 'Image too large (max 2MB)' }, { status: 413 })
  }

  const logosDir = join(process.cwd(), 'public', 'logos')
  const filePath  = join(logosDir, `${groupKey}.jpg`)

  await mkdir(logosDir, { recursive: true })
  await writeFile(filePath, buffer)

  return NextResponse.json({ success: true, data: { path: `/api/logos/${groupKey}.jpg` } })
}
