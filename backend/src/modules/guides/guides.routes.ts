import type { FastifyInstance } from 'fastify'
import { findAllGuides, findGuideById } from './guides.repository.js'

export async function guideRoutes(app: FastifyInstance) {
  // Public: list all active guides
  app.get('/guides', async (_req, reply) => {
    const data = await findAllGuides()
    return reply.send({ success: true, data })
  })

  // Public: single guide
  app.get<{ Params: { id: string } }>('/guides/:id', async (req, reply) => {
    const guide = await findGuideById(Number(req.params.id))
    if (!guide) {
      return reply.status(404).send({ success: false, error: 'Guide not found' })
    }
    return reply.send({ success: true, data: guide })
  })
}
