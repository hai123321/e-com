import fp from 'fastify-plugin'
import { ZodError } from 'zod'

export default fp(async (app) => {
  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error)

    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.flatten().fieldErrors,
      })
    }

    const statusCode = (error as { statusCode?: number }).statusCode ?? 500
    const message = statusCode < 500 ? error.message : 'Internal server error'

    return reply.status(statusCode).send({ success: false, error: message })
  })
})
