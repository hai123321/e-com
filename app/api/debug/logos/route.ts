import { NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

/**
 * GET /api/debug/logos
 * Trả về danh sách file thực tế trong public/logos/ và public/logos_baked/
 * Dùng để debug trên server — chỉ enable khi NODE_ENV !== production
 * hoặc có query ?key=debug
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (
    process.env.NODE_ENV === 'production' &&
    searchParams.get('key') !== 'miu-debug-2025'
  ) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const cwd = process.cwd()

  async function listDir(dir: string) {
    try {
      const files = await readdir(dir)
      const jpgs  = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      const sizes = await Promise.all(
        jpgs.map(async f => {
          const s = await stat(join(dir, f)).catch(() => null)
          return { name: f, bytes: s?.size ?? 0 }
        })
      )
      return { path: dir, count: jpgs.length, files: sizes }
    } catch (e) {
      return { path: dir, count: 0, error: String(e), files: [] }
    }
  }

  const [logos, baked] = await Promise.all([
    listDir(join(cwd, 'public', 'logos')),
    listDir(join(cwd, 'public', 'logos_baked')),
  ])

  return NextResponse.json({
    cwd,
    logos,
    logos_baked: baked,
    summary: {
      logos_count:       logos.count,
      logos_baked_count: baked.count,
      missing_in_logos:  baked.files
        .filter(b => !logos.files.find(l => l.name === b.name))
        .map(b => b.name),
    },
  })
}
