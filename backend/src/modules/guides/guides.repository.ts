import { eq, asc } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { guides } from '../../db/schema.js'

export async function findAllGuides() {
  return db
    .select()
    .from(guides)
    .where(eq(guides.isActive, true))
    .orderBy(asc(guides.sortOrder), asc(guides.id))
}

export async function findGuideById(id: number) {
  const [guide] = await db
    .select()
    .from(guides)
    .where(eq(guides.id, id))
  return guide ?? null
}
