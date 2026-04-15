import Fastify from 'fastify'
import { config } from './config.js'
import { checkDbConnection } from './db/client.js'
import corsPlugin from './plugins/cors.js'
import jwtPlugin from './plugins/jwt.js'
import errorHandler from './plugins/error-handler.js'
import { productRoutes } from './modules/products/products.routes.js'
import { orderRoutes } from './modules/orders/orders.routes.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { guideRoutes } from './modules/guides/guides.routes.js'

const app = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: config.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

// Plugins
await app.register(corsPlugin)
await app.register(jwtPlugin)
await app.register(errorHandler)

// Health check
app.get('/api/v1/health', async (_req, reply) => {
  try {
    await checkDbConnection()
    return reply.send({ success: true, data: { status: 'ok' } })
  } catch {
    return reply.status(503).send({ success: false, error: 'Database unavailable' })
  }
})

// Routes
await app.register(productRoutes, { prefix: '/api/v1' })
await app.register(orderRoutes,   { prefix: '/api/v1' })
await app.register(authRoutes,    { prefix: '/api/v1' })
await app.register(guideRoutes,   { prefix: '/api/v1' })

// Start
try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
  app.log.info(`🚀 Server running on port ${config.PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
