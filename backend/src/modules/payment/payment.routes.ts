import type { FastifyInstance } from 'fastify'
import * as service from './payment.service.js'
import * as repo from './payment.repository.js'
import {
  createTopupPaymentSchema,
  ipnPayloadSchema,
  transactionQuerySchema,
} from './payment.schema.js'

export async function paymentRoutes(app: FastifyInstance) {
  // POST /payment/order/:orderId — create Sepay payment link (user auth)
  app.post<{ Params: { orderId: string } }>('/payment/order/:orderId', {
    preHandler: [app.authenticateUser],
  }, async (req, reply) => {
    const payload  = req.user as { id: number }
    const orderId  = Number(req.params.orderId)
    const { amount } = req.body as { amount?: number }
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return reply.status(400).send({ success: false, error: 'Invalid orderId' })
    }
    const result = await service.createOrderPayment(orderId, amount ?? 0, payload.id)
    return reply.status(201).send({ success: true, data: result })
  })

  // POST /payment/topup — create Sepay payment link for top-up (user auth)
  app.post('/payment/topup', {
    preHandler: [app.authenticateUser],
  }, async (req, reply) => {
    const payload = req.user as { id: number }
    const input   = createTopupPaymentSchema.parse(req.body)
    const result  = await service.createTopupPayment(payload.id, input.amount)
    return reply.status(201).send({ success: true, data: result })
  })

  // POST /webhooks/sepay — IPN from Sepay (no auth, verified by HMAC)
  app.post('/webhooks/sepay', async (req, reply) => {
    const ipn = ipnPayloadSchema.parse(req.body)
    // Must respond 200 immediately; process async (fire-and-forget with error logging)
    reply.status(200).send({ success: true })
    service.processIPN(ipn).catch((err) => app.log.error(err, 'IPN processing error'))
  })

  // GET /payment/transaction/:id — check transaction status (user auth)
  app.get<{ Params: { id: string } }>('/payment/transaction/:id', {
    preHandler: [app.authenticateUser],
  }, async (req, reply) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return reply.status(400).send({ success: false, error: 'Invalid id' })
    }
    const tx = await repo.findTransactionById(id)
    if (!tx) return reply.status(404).send({ success: false, error: 'Transaction not found' })
    return reply.send({ success: true, data: tx })
  })

  // GET /admin/payment/transactions — list all transactions (admin auth)
  app.get('/admin/payment/transactions', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const query = transactionQuerySchema.parse(req.query)
    const result = await repo.listTransactions(query)
    return reply.send({ success: true, ...result })
  })
}
