import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { config } from '../config.js'

export default fp(async (app) => {
  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
})
