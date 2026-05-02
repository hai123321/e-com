import type { FastifyInstance } from 'fastify'
import * as repo from './notifications.repository.js'

export async function notificationsRoutes(app: FastifyInstance) {
  // GET /me/notifications
  app.get('/me/notifications', {
    preHandler: [app.authenticateUser],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: number }
    const [items, unread] = await Promise.all([
      repo.listNotifications(userId),
      repo.countUnread(userId),
    ])
    return reply.send({ success: true, data: { items, unread } })
  })

  // PATCH /me/notifications/read-all
  app.patch('/me/notifications/read-all', {
    preHandler: [app.authenticateUser],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: number }
    await repo.markAllRead(userId)
    return reply.send({ success: true })
  })

  // PATCH /me/notifications/:id/read
  app.patch('/me/notifications/:id/read', {
    preHandler: [app.authenticateUser],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: number }
    const { id } = req.params as { id: string }
    const row = await repo.markOneRead(parseInt(id), userId)
    if (!row) return reply.code(404).send({ success: false, error: 'Not found' })
    return reply.send({ success: true, data: row })
  })
}
