import type { FastifyInstance } from 'fastify'
import { createPromotionSchema, updatePromotionSchema, validateCodeSchema } from './promotions.schema.js'
import { getAll, validateCode, create, update, remove } from './promotions.service.js'

export async function promotionRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] }

  // Public: validate a coupon code
  app.post('/promotions/validate', async (req, reply) => {
    const { code, orderTotal } = validateCodeSchema.parse(req.body)
    const result = await validateCode(code, orderTotal)
    return reply.send({ success: true, data: result })
  })

  app.get('/admin/promotions', auth, async () => {
    return { success: true, data: await getAll() }
  })

  app.post('/admin/promotions', auth, async (req, reply) => {
    const input = createPromotionSchema.parse(req.body)
    const promo = await create(input as any)
    return reply.status(201).send({ success: true, data: promo })
  })

  app.put<{ Params: { id: string } }>('/admin/promotions/:id', auth, async (req, reply) => {
    const input = updatePromotionSchema.parse(req.body)
    const promo = await update(parseInt(req.params.id), input as any)
    return reply.send({ success: true, data: promo })
  })

  app.delete<{ Params: { id: string } }>('/admin/promotions/:id', auth, async (req, reply) => {
    await remove(parseInt(req.params.id))
    return reply.send({ success: true })
  })
}
