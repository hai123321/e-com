import bcrypt from 'bcrypt'
import createError from '@fastify/error'
import type { FastifyInstance } from 'fastify'
import {
  findUserByEmail,
  findUserByGoogleId,
  createUser,
  findUserById,
  updateUser,
  type User,
} from './user-auth.repository.js'

const Conflict    = createError('FST_ERR_CONFLICT', '%s', 409)
const Unauthorized = createError('FST_ERR_UNAUTHORIZED', '%s', 401)
const Forbidden   = createError('FST_ERR_FORBIDDEN', '%s', 403)

export async function registerUser(
  app: FastifyInstance,
  input: { email: string; name: string; password: string }
): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
  const existing = await findUserByEmail(input.email)
  if (existing) {
    throw new Conflict('Email đã được sử dụng')
  }
  const passwordHash = await bcrypt.hash(input.password, 12)
  const user = await createUser({ email: input.email, name: input.name, passwordHash })
  const token = app.jwt.sign({ id: user.id, email: user.email, role: 'user' }, { expiresIn: '30d' })
  const { passwordHash: _, ...safeUser } = user
  return { token, user: safeUser }
}

export async function loginUser(
  app: FastifyInstance,
  input: { email: string; password: string }
): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
  const user = await findUserByEmail(input.email)
  if (!user || !user.passwordHash) {
    throw new Unauthorized('Email hoặc mật khẩu không đúng')
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) {
    throw new Unauthorized('Email hoặc mật khẩu không đúng')
  }
  if (!user.isActive) {
    throw new Forbidden('Tài khoản đã bị khóa')
  }
  const token = app.jwt.sign({ id: user.id, email: user.email, role: 'user' }, { expiresIn: '30d' })
  const { passwordHash: _, ...safeUser } = user
  return { token, user: safeUser }
}

export async function findOrCreateGoogleUser(
  app: FastifyInstance,
  profile: { googleId: string; email: string; name: string; avatar?: string }
): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
  let user = await findUserByGoogleId(profile.googleId)
  if (!user) {
    user = await findUserByEmail(profile.email)
    if (user) {
      // Link Google to existing email account
      user = (await updateUser(user.id, { googleId: profile.googleId, avatar: profile.avatar })) ?? user
    } else {
      user = await createUser({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        googleId: profile.googleId,
      })
    }
  }
  if (!user.isActive) throw new Forbidden('Tài khoản đã bị khóa')
  const token = app.jwt.sign({ id: user.id, email: user.email, role: 'user' }, { expiresIn: '30d' })
  const { passwordHash: _, ...safeUser } = user
  return { token, user: safeUser }
}

export async function updateProfile(
  userId: number,
  input: { name?: string; avatar?: string | null }
): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await updateUser(userId, input)
  if (!user) return null
  const { passwordHash: _, ...safeUser } = user
  return safeUser
}

export async function getMe(userId: number): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await findUserById(userId)
  if (!user) return null
  const { passwordHash: _, ...safeUser } = user
  return safeUser
}
