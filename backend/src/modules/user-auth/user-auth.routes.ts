import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { registerSchema, loginSchema } from './user-auth.schema.js'
import { registerUser, loginUser, getMe, findOrCreateGoogleUser, updateProfile } from './user-auth.service.js'
import { findOrdersByEmail } from '../orders/orders.repository.js'
import { config } from '../../config.js'

const updateProfileSchema = z.object({
  name:   z.string().min(1).max(255).optional(),
  avatar: z.string().url().max(512).optional().nullable(),
})

export async function userAuthRoutes(app: FastifyInstance) {
  // POST /auth/user/register
  app.post('/auth/user/register', async (req, reply) => {
    const input = registerSchema.parse(req.body)
    const result = await registerUser(app, input)
    return reply.status(201).send({ success: true, data: result })
  })

  // POST /auth/user/login
  app.post('/auth/user/login', async (req, reply) => {
    const input = loginSchema.parse(req.body)
    const result = await loginUser(app, input)
    return reply.send({ success: true, data: result })
  })

  // GET /auth/user/me
  app.get('/auth/user/me', {
    preHandler: [app.authenticateUser],
  }, async (req, reply) => {
    const payload = req.user as { id: number; email: string; role: string }
    const user = await getMe(payload.id)
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })
    return reply.send({ success: true, data: user })
  })

  // PUT /auth/user/profile
  app.put('/auth/user/profile', {
    preHandler: [app.authenticateUser],
  }, async (req, reply) => {
    const payload = req.user as { id: number; email: string; role: string }
    const input = updateProfileSchema.parse(req.body)
    const user = await updateProfile(payload.id, input)
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })
    return reply.send({ success: true, data: user })
  })

  // GET /auth/user/orders
  app.get('/auth/user/orders', {
    preHandler: [app.authenticateUser],
  }, async (req, reply) => {
    const payload = req.user as { id: number; email: string; role: string }
    const orders = await findOrdersByEmail(payload.email)
    return reply.send({ success: true, data: orders })
  })

  // GET /auth/google/callback — exchange code → profile → JWT → redirect to frontend
  // The redirect to Google (/auth/google) is handled by @fastify/oauth2 startRedirectPath
  app.get('/auth/google/callback', async (req, reply) => {
    const oauth2 = (app as unknown as Record<string, unknown>).googleOAuth2
    if (!oauth2) {
      return reply.status(503).send({ success: false, error: 'Google SSO not configured' })
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tokenData = await (oauth2 as any).getAccessTokenFromAuthorizationCodeFlow(req)
      const accessToken = tokenData.token.access_token as string

      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!profileRes.ok) {
        throw new Error(`Google userinfo failed: ${profileRes.status}`)
      }

      const profile = await profileRes.json() as {
        id: string
        email: string
        name: string
        picture?: string
      }

      const { token } = await findOrCreateGoogleUser(app, {
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
      })

      return reply.redirect(`${config.FRONTEND_URL}/dang-nhap?token=${token}`)
    } catch (err) {
      app.log.error(err, 'Google OAuth callback error')
      return reply.redirect(`${config.FRONTEND_URL}/dang-nhap?error=oauth_failed`)
    }
  })
}
