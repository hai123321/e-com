import Fastify from 'fastify'
import cookiePlugin from '@fastify/cookie'
import oauth2Plugin from '@fastify/oauth2'
import { config } from './config.js'
import { db, checkDbConnection } from './db/client.js'
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
import { bannerRoutes } from './modules/banners/banners.routes.js'
import { referralRoutes } from './modules/referral/referral.routes.js'
import { subscriptionRoutes } from './modules/subscriptions/subscriptions.routes.js'
import { paymentRoutes } from './modules/payment/payment.routes.js'
import { adminUsersRoutes } from './modules/user-auth/admin-users.routes.js'
import { notificationsRoutes } from './modules/notifications/notifications.routes.js'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsFolder = join(__dirname, '../../drizzle')

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
// Cookie plugin must be registered before @fastify/oauth2 (state is stored in a cookie)
await app.register(cookiePlugin)

// Google OAuth2 (only register when credentials are configured)
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
  const callbackUri = config.GOOGLE_CALLBACK_URL || 'https://api.miushop.io.vn/api/v1/auth/google/callback'
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
    callbackUri,
  })
  app.log.info('✅ Google OAuth2 registered')
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
await app.register(bannerRoutes,    { prefix: '/api/v1' })
await app.register(referralRoutes,      { prefix: '/api/v1' })
await app.register(subscriptionRoutes,  { prefix: '/api/v1' })
await app.register(paymentRoutes,       { prefix: '/api/v1' })
await app.register(adminUsersRoutes,       { prefix: '/api/v1' })
await app.register(notificationsRoutes,    { prefix: '/api/v1' })

// Run pending migrations before starting
try {
  await migrate(db, { migrationsFolder })
  app.log.info('✅ Database migrations applied')
} catch (err) {
  app.log.error(err, 'Migration failed')
  process.exit(1)
}

// Start
try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
  app.log.info(`🚀 Server running on port ${config.PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
