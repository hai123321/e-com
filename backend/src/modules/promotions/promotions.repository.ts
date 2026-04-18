import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { promotions } from '../../db/schema.js'
import { sql } from 'drizzle-orm'

export type Promotion = typeof promotions.$inferSelect
export type NewPromotion = typeof promotions.$inferInsert

export async function listPromotions(): Promise<Promotion[]> {
  return db.select().from(promotions).orderBy(promotions.createdAt)
}

export async function findByCode(code: string): Promise<Promotion | null> {
  const [promo] = await db.select().from(promotions)
    .where(eq(promotions.code, code.toUpperCase()))
    .limit(1)
  return promo ?? null
}

export async function findById(id: number): Promise<Promotion | null> {
  const [promo] = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1)
  return promo ?? null
}

export async function createPromotion(data: NewPromotion): Promise<Promotion> {
  const [promo] = await db.insert(promotions)
    .values({ ...data, code: data.code.toUpperCase() })
    .returning()
  return promo
}

export async function updatePromotion(id: number, data: Partial<NewPromotion>): Promise<Promotion | null> {
  const update = { ...data, updatedAt: new Date() }
  if (update.code) update.code = update.code.toUpperCase()
  const [promo] = await db.update(promotions).set(update).where(eq(promotions.id, id)).returning()
  return promo ?? null
}

export async function deletePromotion(id: number): Promise<boolean> {
  const result = await db.delete(promotions).where(eq(promotions.id, id)).returning()
  return result.length > 0
}

export async function incrementUsedCount(id: number): Promise<void> {
  await db.update(promotions)
    .set({ usedCount: sql`${promotions.usedCount} + 1`, updatedAt: new Date() })
    .where(eq(promotions.id, id))
}
