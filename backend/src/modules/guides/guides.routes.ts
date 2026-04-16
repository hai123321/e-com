import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  findAllGuides,
  findAllGuidesAdmin,
  findGuideById,
  createGuide,
  updateGuide,
  deleteGuide,
} from './guides.repository.js'

const createGuideSchema = z.object({
  sortOrder: z.number().int().default(0),
  type: z.string().min(1).max(255),
  descriptionVi: z.string().default(''),
  descriptionEn: z.string().default(''),
  descriptionCn: z.string().default(''),
})

const updateGuideSchema = createGuideSchema.partial()

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

  // Admin: list all guides (including inactive)
  app.get('/admin/guides', {
    preHandler: [(app as any).authenticate],
  }, async (_req, reply) => {
    const data = await findAllGuidesAdmin()
    return reply.send({ success: true, data })
  })

  // Admin: create guide
  app.post('/admin/guides', {
    preHandler: [(app as any).authenticate],
  }, async (req, reply) => {
    const input = createGuideSchema.parse(req.body)
    const guide = await createGuide(input)
    return reply.status(201).send({ success: true, data: guide })
  })

  // Admin: update guide
  app.put<{ Params: { id: string } }>('/admin/guides/:id', {
    preHandler: [(app as any).authenticate],
  }, async (req, reply) => {
    const input = updateGuideSchema.parse(req.body)
    const guide = await updateGuide(Number(req.params.id), input)
    if (!guide) {
      return reply.status(404).send({ success: false, error: 'Guide not found' })
    }
    return reply.send({ success: true, data: guide })
  })

  // Admin: delete guide
  app.delete<{ Params: { id: string } }>('/admin/guides/:id', {
    preHandler: [(app as any).authenticate],
  }, async (req, reply) => {
    const guide = await deleteGuide(Number(req.params.id))
    if (!guide) {
      return reply.status(404).send({ success: false, error: 'Guide not found' })
    }
    return reply.send({ success: true, data: guide })
  })
}
