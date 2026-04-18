import { NextRequest, NextResponse } from 'next/server'
import { apiUrl } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(apiUrl('/promotions/validate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { valid: false, message: json.error ?? json.message ?? 'Mã không hợp lệ' },
        { status: res.status },
      )
    }
    const data = json.data ?? json
    return NextResponse.json({
      valid: true,
      discount: data.discountAmount,
      promotionId: data.promotionId,
      finalTotal: data.finalTotal,
    })
  } catch {
    return NextResponse.json({ valid: false, message: 'Lỗi kết nối' }, { status: 503 })
  }
}
