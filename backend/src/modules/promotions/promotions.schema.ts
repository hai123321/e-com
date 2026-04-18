import { z } from 'zod'

export const createPromotionSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().int().positive(),
  minOrderValue: z.number().int().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z.union([z.string(), z.null(), z.undefined()])
    .transform((v): Date | null => (v && v !== '') ? new Date(v) : null)
    .optional(),
})

export const updatePromotionSchema = createPromotionSchema.partial()

export const validateCodeSchema = z.object({
  code: z.string(),
  orderTotal: z.number().int().positive(),
})

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>
