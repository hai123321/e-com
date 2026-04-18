import type { FastifyInstance } from 'fastify'
import { createRuleSchema, updateRuleSchema } from './pricing.schema.js'
import { getAllRules, createPricingRule, updatePricingRule, deletePricingRule, previewEffectivePrice } from './pricing.service.js'

export async function pricingRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] }

  app.get('/admin/pricing-rules', auth, async () => {
    const rules = await getAllRules()
    return { success: true, data: rules }
  })

  app.post('/admin/pricing-rules', auth, async (req, reply) => {
    const input = createRuleSchema.parse(req.body)
    const rule = await createPricingRule(input as any)
    return reply.status(201).send({ success: true, data: rule })
  })

  app.put<{ Params: { id: string } }>('/admin/pricing-rules/:id', auth, async (req, reply) => {
    const input = updateRuleSchema.parse(req.body)
    const rule = await updatePricingRule(parseInt(req.params.id), input as any)
    return reply.send({ success: true, data: rule })
  })

  app.delete<{ Params: { id: string } }>('/admin/pricing-rules/:id', auth, async (req, reply) => {
    await deletePricingRule(parseInt(req.params.id))
    return reply.send({ success: true })
  })

  app.get<{ Params: { productId: string } }>('/admin/pricing-rules/preview/:productId', auth, async (req) => {
    const result = await previewEffectivePrice(parseInt(req.params.productId))
    return { success: true, data: result }
  })
}
