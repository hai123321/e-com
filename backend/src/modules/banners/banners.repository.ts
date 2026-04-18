import { eq, desc } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { banners, type NewBanner } from '../../db/schema.js'

export async function findActiveBanners() {
  return db
    .select()
    .from(banners)
    .where(eq(banners.isActive, true))
    .orderBy(desc(banners.priority))
}

export async function findAllBannersAdmin() {
  return db
    .select()
    .from(banners)
    .orderBy(desc(banners.priority))
}

export async function createBanner(data: NewBanner) {
  const [banner] = await db
    .insert(banners)
    .values(data)
    .returning()
  return banner
}

export async function updateBanner(id: number, data: Partial<NewBanner>) {
  const [banner] = await db
    .update(banners)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(banners.id, id))
    .returning()
  return banner ?? null
}

export async function deleteBanner(id: number) {
  const [banner] = await db
    .delete(banners)
    .where(eq(banners.id, id))
    .returning()
  return banner ?? null
}
