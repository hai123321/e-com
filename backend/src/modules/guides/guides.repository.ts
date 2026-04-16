import { eq, asc } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { guides, type NewGuide } from '../../db/schema.js'

export async function findAllGuides() {
  return db
    .select()
    .from(guides)
    .where(eq(guides.isActive, true))
    .orderBy(asc(guides.sortOrder), asc(guides.id))
}

export async function findAllGuidesAdmin() {
  return db
    .select()
    .from(guides)
    .orderBy(asc(guides.sortOrder), asc(guides.id))
}

export async function findGuideById(id: number) {
  const [guide] = await db
    .select()
    .from(guides)
    .where(eq(guides.id, id))
  return guide ?? null
}

export async function createGuide(data: NewGuide) {
  const [guide] = await db
    .insert(guides)
    .values(data)
    .returning()
  return guide
}

export async function updateGuide(id: number, data: Partial<NewGuide>) {
  const [guide] = await db
    .update(guides)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(guides.id, id))
    .returning()
  return guide ?? null
}

export async function deleteGuide(id: number) {
  const [guide] = await db
    .delete(guides)
    .where(eq(guides.id, id))
    .returning()
  return guide ?? null
}
