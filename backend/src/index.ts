import Fastify from 'fastify'
import oauth2Plugin from '@fastify/oauth2'
import { config } from './config.js'
import { checkDbConnection } from './db/client.js'
import corsPlugin from './plugins/cors.js'
import jwtPlugin from './plugins/jwt.js'
import errorHandler from './plugins/error-handler.js'
import { productRoutes } from './modules/products/products.routes.js'
import { orderRoutes } from './modules/orders/orders.routes.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { guideRoutes } from './modules/guides/guides.routes.js'
import { userAuthRoutes } from './modules/user-auth/user-auth.routes.js'
import { pricingRoutes } from './modules/pricing/pricing.routes.js'
import { promotionRoutes } from './modules/promotions/promotions.routes.js'

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

// Google OAuth2 (only register when credentials are configured)
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_CALLBACK_URL) {
  await app.register(oauth2Plugin, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: config.GOOGLE_CLIENT_ID,
        secret: config.GOOGLE_CLIENT_SECRET,
      },
      auth: {
        authorizeHost: 'https://accounts.google.com',
        authorizePath: '/o/oauth2/v2/auth',
        tokenHost: 'https://oauth2.googleapis.com',
        tokenPath: '/token',
      },
    },
    startRedirectPath: '/api/v1/auth/google',
    callbackUri: config.GOOGLE_CALLBACK_URL,
  })
}

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
await app.register(productRoutes,  { prefix: '/api/v1' })
await app.register(orderRoutes,    { prefix: '/api/v1' })
await app.register(authRoutes,     { prefix: '/api/v1' })
await app.register(guideRoutes,    { prefix: '/api/v1' })
await app.register(userAuthRoutes, { prefix: '/api/v1' })
await app.register(pricingRoutes,   { prefix: '/api/v1' })
await app.register(promotionRoutes, { prefix: '/api/v1' })

// Start
try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
  app.log.info(`🚀 Server running on port ${config.PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
