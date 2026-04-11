import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { admins } from '../../db/schema.js'
import type { LoginInput } from './auth.schema.js'

export async function login(input: LoginInput) {
  const [admin] = await db.select().from(admins).where(eq(admins.username, input.username))
  if (!admin) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })

  const valid = await bcrypt.compare(input.password, admin.passwordHash)
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })

  return { id: admin.id, username: admin.username }
}
