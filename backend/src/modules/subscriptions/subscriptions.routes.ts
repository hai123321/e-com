import type { FastifyInstance } from 'fastify'
import { createSubscriptionSchema, updateSubscriptionSchema } from './subscriptions.schema.js'
import {
  listSubscriptions,
  addSubscription,
  editSubscription,
  removeSubscription,
  importFromOrders,
  getSubscriptionSummary,
} from './subscriptions.service.js'

export async function subscriptionRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticateUser] }

  // GET /me/subscriptions
  app.get('/me/subscriptions', auth, async (req, reply) => {
    const { id } = req.user as { id: number }
    const data = await listSubscriptions(id)
    return reply.send({ success: true, data })
  })

  // POST /me/subscriptions
  app.post('/me/subscriptions', auth, async (req, reply) => {
    const { id } = req.user as { id: number }
    const input = createSubscriptionSchema.parse(req.body)
    const data = await addSubscription(id, input)
    return reply.status(201).send({ success: true, data })
  })

  // PUT /me/subscriptions/:id
  app.put('/me/subscriptions/:id', auth, async (req, reply) => {
    const { id: userId } = req.user as { id: number }
    const { id } = req.params as { id: string }
    const input = updateSubscriptionSchema.parse(req.body)
    const data = await editSubscription(Number(id), userId, input)
    return reply.send({ success: true, data })
  })

  // DELETE /me/subscriptions/:id
  app.delete('/me/subscriptions/:id', auth, async (req, reply) => {
    const { id: userId } = req.user as { id: number }
    const { id } = req.params as { id: string }
    await removeSubscription(Number(id), userId)
    return reply.status(204).send()
  })

  // POST /me/subscriptions/import-orders
  app.post('/me/subscriptions/import-orders', auth, async (req, reply) => {
    const { id, email } = req.user as { id: number; email: string }
    const data = await importFromOrders(id, email)
    return reply.send({ success: true, data })
  })

  // GET /me/subscriptions/summary
  app.get('/me/subscriptions/summary', auth, async (req, reply) => {
    const { id } = req.user as { id: number }
    const data = await getSubscriptionSummary(id)
    return reply.send({ success: true, data })
  })
}
