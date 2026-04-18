import { z } from 'zod'

export const createPromotionSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().int().positive(),
  minOrderValue: z.number().int().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
})

export const updatePromotionSchema = createPromotionSchema.partial()

export const validateCodeSchema = z.object({
  code: z.string(),
  orderTotal: z.number().int().positive(),
})

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>
