import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  findActiveBanners,
  findAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
} from './banners.repository.js'

const createBannerSchema = z.object({
  title:    z.string().max(255).default(''),
  subtitle: z.string().max(255).default(''),
  image:    z.string().max(512).default(''),
  href:     z.string().max(512).default('/#products'),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

const updateBannerSchema = createBannerSchema.partial()

export async function bannerRoutes(app: FastifyInstance) {
  // Public: list active banners sorted by priority desc
  app.get('/banners', async (_req, reply) => {
    const data = await findActiveBanners()
    return reply.send({ success: true, data })
  })

  // Admin: list all banners (including inactive)
  app.get('/admin/banners', {
    preHandler: [(app as any).authenticate],
  }, async (_req, reply) => {
    const data = await findAllBannersAdmin()
    return reply.send({ success: true, data })
  })

  // Admin: create banner
  app.post('/admin/banners', {
    preHandler: [(app as any).authenticate],
  }, async (req, reply) => {
    const input = createBannerSchema.parse(req.body)
    const banner = await createBanner(input)
    return reply.status(201).send({ success: true, data: banner })
  })

  // Admin: update banner
  app.put<{ Params: { id: string } }>('/admin/banners/:id', {
    preHandler: [(app as any).authenticate],
  }, async (req, reply) => {
    const input = updateBannerSchema.parse(req.body)
    const banner = await updateBanner(Number(req.params.id), input)
    if (!banner) {
      return reply.status(404).send({ success: false, error: 'Banner not found' })
    }
    return reply.send({ success: true, data: banner })
  })

  // Admin: delete banner
  app.delete<{ Params: { id: string } }>('/admin/banners/:id', {
    preHandler: [(app as any).authenticate],
  }, async (req, reply) => {
    const banner = await deleteBanner(Number(req.params.id))
    if (!banner) {
      return reply.status(404).send({ success: false, error: 'Banner not found' })
    }
    return reply.send({ success: true, data: banner })
  })
}
