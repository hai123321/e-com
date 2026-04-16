import type { FastifyInstance } from 'fastify'
import { registerSchema, loginSchema } from './user-auth.schema.js'
import { registerUser, loginUser, getMe } from './user-auth.service.js'

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
}
