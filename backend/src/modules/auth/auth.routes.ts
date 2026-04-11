import type { FastifyInstance } from 'fastify'
import * as service from './auth.service.js'
import { loginSchema } from './auth.schema.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const input = loginSchema.parse(req.body)
    const admin = await service.login(input)
    const token = app.jwt.sign({ id: admin.id, username: admin.username }, { expiresIn: '7d' })
    return reply.send({ success: true, data: { token, admin } })
  })
}
