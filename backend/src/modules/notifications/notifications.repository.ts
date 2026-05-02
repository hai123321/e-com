import { eq, and, desc, count } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { userNotifications } from '../../db/schema.js'
import type { NewUserNotification } from '../../db/schema.js'

export async function createNotification(data: NewUserNotification) {
  const [row] = await db.insert(userNotifications).values(data).returning()
  return row
}

export async function listNotifications(userId: number, limit = 50) {
  return db
    .select()
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt))
    .limit(limit)
}

export async function countUnread(userId: number): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(userNotifications)
    .where(and(
      eq(userNotifications.userId, userId),
      eq(userNotifications.isRead, false),
    ))
  return Number(value)
}

export async function markOneRead(id: number, userId: number) {
  const [row] = await db
    .update(userNotifications)
    .set({ isRead: true })
    .where(and(
      eq(userNotifications.id, id),
      eq(userNotifications.userId, userId),
    ))
    .returning()
  return row ?? null
}

export async function markAllRead(userId: number) {
  await db
    .update(userNotifications)
    .set({ isRead: true })
    .where(and(
      eq(userNotifications.userId, userId),
      eq(userNotifications.isRead, false),
    ))
}
