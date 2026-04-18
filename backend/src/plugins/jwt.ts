import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { config } from '../config.js'
import type { FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    authenticateUser: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async (app) => {
  await app.register(fastifyJwt, { secret: config.JWT_SECRET })

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      return reply.status(401).send({ success: false, error: 'Unauthorized' })
    }
  })

  app.decorate('authenticateUser', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
      if ((req.user as { role?: string }).role !== 'user') throw new Error('not a user token')
    } catch {
      return reply.status(401).send({ success: false, error: 'Unauthorized' })
    }
  })
})
