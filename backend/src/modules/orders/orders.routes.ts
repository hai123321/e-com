import type { FastifyInstance } from 'fastify'
import * as service from './orders.service.js'
import * as repo from './orders.repository.js'
import { createOrderSchema, orderQuerySchema, updateOrderStatusSchema } from './orders.schema.js'

export async function orderRoutes(app: FastifyInstance) {
  // Public: create order
  app.post('/orders', async (req, reply) => {
    const input = createOrderSchema.parse(req.body)
    const order = await service.createOrder(input)
    return reply.status(201).send({ success: true, data: order })
  })

  // Admin: list orders
  app.get('/admin/orders', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const query = orderQuerySchema.parse(req.query)
    const result = await service.listOrders(query)
    return reply.send({ success: true, ...result })
  })

  // Admin: order detail
  app.get<{ Params: { id: string } }>('/admin/orders/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const order = await service.getOrder(Number(req.params.id))
    return reply.send({ success: true, data: order })
  })

  // Admin: update order status
  app.put<{ Params: { id: string } }>('/admin/orders/:id/status', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const input = updateOrderStatusSchema.parse(req.body)
    const order = await service.updateOrderStatus(Number(req.params.id), input)
    return reply.send({ success: true, data: order })
  })

  // Public: user order history by phone
  app.get('/user/orders', async (req, reply) => {
    const { phone } = req.query as { phone?: string }
    if (!phone || phone.trim().length < 9) {
      return reply.status(400).send({ success: false, error: 'phone query param required' })
    }
    const orders = await repo.findOrdersByPhone(phone.trim())
    return reply.send({ success: true, data: orders })
  })

  // Admin: dashboard stats
  app.get('/admin/dashboard', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    const stats = await service.getDashboardStats()
    return reply.send({ success: true, data: stats })
  })
}
