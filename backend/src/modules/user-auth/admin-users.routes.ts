import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import * as repo from './admin-users.repository.js'

const BCRYPT_ROUNDS = 12

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

const listQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  search:   z.string().optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
})

const statusBodySchema = z.object({
  isActive: z.boolean(),
})

const withinDaysSchema = z.object({
  withinDays: z.coerce.number().int().min(1).max(365).default(7),
})

export async function adminUsersRoutes(app: FastifyInstance) {
  // GET /admin/users/expiring-subscriptions — must be before /:id
  app.get('/admin/users/expiring-subscriptions', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { withinDays } = withinDaysSchema.parse(req.query)
    const data = await repo.getExpiringSubscriptions(withinDays)
    return reply.send({ success: true, data })
  })

  // GET /admin/users
  app.get('/admin/users', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const query = listQuerySchema.parse(req.query)
    const { rows, total, page, limit } = await repo.listUsers(query)
    return reply.send({
      success: true,
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  })

  // GET /admin/users/:id
  app.get<{ Params: { id: string } }>('/admin/users/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return reply.status(400).send({ success: false, error: 'Invalid user id' })
    }
    const user = await repo.getUserDetail(id)
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })
    return reply.send({ success: true, data: user })
  })

  // GET /admin/users/:id/stats
  app.get<{ Params: { id: string } }>('/admin/users/:id/stats', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return reply.status(400).send({ success: false, error: 'Invalid user id' })
    }
    const stats = await repo.getUserStats(id)
    return reply.send({ success: true, data: stats })
  })

  // PATCH /admin/users/:id/status
  app.patch<{ Params: { id: string } }>('/admin/users/:id/status', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return reply.status(400).send({ success: false, error: 'Invalid user id' })
    }
    const { isActive } = statusBodySchema.parse(req.body)
    const user = await repo.setUserStatus(id, isActive)
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })
    return reply.send({ success: true, data: { id: user.id, isActive: user.isActive } })
  })

  // POST /admin/users/:id/reset-password
  app.post<{ Params: { id: string } }>('/admin/users/:id/reset-password', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return reply.status(400).send({ success: false, error: 'Invalid user id' })
    }
    const newPassword = generatePassword(12)
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    const user = await repo.setUserPassword(id, passwordHash)
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })
    return reply.send({ success: true, data: { newPassword } })
  })
}
