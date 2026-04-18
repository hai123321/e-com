import type { FastifyInstance } from 'fastify'
import { applyReferralSchema } from './referral.schema.js'
import { fetchReferralCode, fetchStats, applyReferral } from './referral.service.js'

export async function referralRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticateUser] }

  // GET /referral/code — get or create the user's referral code
  app.get('/referral/code', auth, async (req, reply) => {
    const { id } = req.user as { id: number }
    const data = await fetchReferralCode(id)
    return reply.send({ success: true, data })
  })

  // GET /referral/stats — referral count + total credits earned
  app.get('/referral/stats', auth, async (req, reply) => {
    const { id } = req.user as { id: number }
    const data = await fetchStats(id)
    return reply.send({ success: true, data })
  })

  // POST /referral/apply — credit the referrer after first purchase
  app.post('/referral/apply', auth, async (req, reply) => {
    const { referralCode } = applyReferralSchema.parse(req.body)
    const { id } = req.user as { id: number }
    const result = await applyReferral(id, referralCode)
    return reply.send({ success: true, data: result })
  })
}
