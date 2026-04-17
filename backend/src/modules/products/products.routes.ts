import type { FastifyInstance } from 'fastify'
import * as service from './products.service.js'
import {
  createProductSchema, updateProductSchema, productQuerySchema, setFlashSaleSchema,
} from './products.schema.js'

export async function productRoutes(app: FastifyInstance) {
  // Public: list active products
  app.get('/products', async (req, reply) => {
    const query = productQuerySchema.parse(req.query)
    const result = await service.listProducts(query)
    return reply.send({ success: true, ...result })
  })

  // Public: single product
  app.get<{ Params: { id: string } }>('/products/:id', async (req, reply) => {
    const product = await service.getProduct(Number(req.params.id))
    return reply.send({ success: true, data: product })
  })

  // Admin: list all products (including inactive)
  app.get('/admin/products', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const query = productQuerySchema.parse(req.query)
    const result = await service.listProducts(query, true)
    return reply.send({ success: true, ...result })
  })

  // Admin: create product
  app.post('/admin/products', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const input = createProductSchema.parse(req.body)
    const product = await service.createProduct(input)
    return reply.status(201).send({ success: true, data: product })
  })

  // Admin: update product
  app.put<{ Params: { id: string } }>('/admin/products/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const input = updateProductSchema.parse(req.body)
    const product = await service.updateProduct(Number(req.params.id), input)
    return reply.send({ success: true, data: product })
  })

  // Admin: delete product
  app.delete<{ Params: { id: string } }>('/admin/products/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    await service.deleteProduct(Number(req.params.id))
    return reply.send({ success: true })
  })

  // Admin: set flash sale
  app.post<{ Params: { id: string } }>('/admin/products/:id/flash-sale', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const input = setFlashSaleSchema.parse(req.body)
    const product = await service.updateProduct(Number(req.params.id), {
      salePrice: input.salePrice,
      saleEndsAt: input.saleEndsAt,
    })
    return reply.send({ success: true, data: product })
  })

  // Admin: clear flash sale
  app.delete<{ Params: { id: string } }>('/admin/products/:id/flash-sale', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const product = await service.updateProduct(Number(req.params.id), {
      salePrice: null,
      saleEndsAt: null,
    })
    return reply.send({ success: true, data: product })
  })
}
