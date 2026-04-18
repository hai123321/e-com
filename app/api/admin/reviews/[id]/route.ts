import { NextRequest, NextResponse } from 'next/server'

function getStore() {
  if (!global.__reviews) global.__reviews = []
  return global.__reviews
}

function isAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'admin' || payload.isAdmin === true
  } catch {
    return token.endsWith('.admin')
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl) {
    const res = await fetch(`${apiUrl}/admin/reviews/${params.id}`, {
      method: 'DELETE',
      headers: { Authorization: req.headers.get('Authorization') ?? '' },
    })
    const json = await res.json().catch(() => ({}))
    return NextResponse.json(json, { status: res.status })
  }

  if (!isAdmin(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const store = getStore()
  const idx = store.findIndex((r) => r.id === params.id)
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  store.splice(idx, 1)
  return NextResponse.json({ success: true })
}
