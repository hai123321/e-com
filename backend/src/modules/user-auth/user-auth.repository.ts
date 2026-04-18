import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { users } from '../../db/schema.js'

export type NewUser = typeof users.$inferInsert
export type User = typeof users.$inferSelect

export async function findUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user ?? null
}

export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1)
  return user ?? null
}

export async function findUserById(id: number): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user ?? null
}

export async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning()
  return user
}

export async function updateUser(id: number, data: Partial<NewUser>): Promise<User | null> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
  return user ?? null
}
