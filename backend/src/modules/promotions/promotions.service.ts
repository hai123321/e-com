import { listPromotions, findByCode, findById, createPromotion, updatePromotion, deletePromotion } from './promotions.repository.js'
import type { NewPromotion } from './promotions.repository.js'

export async function getAll() {
  return listPromotions()
}

export async function validateCode(
  code: string,
  orderTotal: number
): Promise<{ promotionId: number; discountAmount: number; finalTotal: number }> {
  const promo = await findByCode(code)
  if (!promo) throw Object.assign(new Error('Mã khuyến mại không tồn tại'), { statusCode: 404 })
  if (!promo.isActive) throw Object.assign(new Error('Mã khuyến mại đã hết hiệu lực'), { statusCode: 400 })
  if (promo.expiresAt && promo.expiresAt < new Date()) throw Object.assign(new Error('Mã khuyến mại đã hết hạn'), { statusCode: 400 })
  if (promo.maxUses && promo.usedCount >= promo.maxUses) throw Object.assign(new Error('Mã khuyến mại đã hết lượt sử dụng'), { statusCode: 400 })
  if (promo.minOrderValue && orderTotal < promo.minOrderValue) {
    throw Object.assign(
      new Error(`Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString()}đ để dùng mã này`),
      { statusCode: 400 }
    )
  }
  const discountAmount = promo.discountType === 'percent'
    ? Math.round(orderTotal * promo.discountValue / 100)
    : Math.min(promo.discountValue, orderTotal)
  return { promotionId: promo.id, discountAmount, finalTotal: orderTotal - discountAmount }
}

export async function create(data: NewPromotion) {
  const existing = await findByCode(data.code)
  if (existing) throw Object.assign(new Error('Mã khuyến mại đã tồn tại'), { statusCode: 409 })
  return createPromotion(data)
}

export async function update(id: number, data: Partial<NewPromotion>) {
  const promo = await findById(id)
  if (!promo) throw Object.assign(new Error('Promotion not found'), { statusCode: 404 })
  return updatePromotion(id, data)
}

export async function remove(id: number) {
  const ok = await deletePromotion(id)
  if (!ok) throw Object.assign(new Error('Promotion not found'), { statusCode: 404 })
}
