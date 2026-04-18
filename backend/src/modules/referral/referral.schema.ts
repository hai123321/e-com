import { z } from 'zod'

export const applyReferralSchema = z.object({
  referralCode: z.string().min(1).max(20),
})
