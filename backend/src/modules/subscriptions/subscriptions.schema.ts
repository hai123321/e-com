import { z } from 'zod'

export const createSubscriptionSchema = z.object({
  serviceName:  z.string().min(1).max(255),
  logoUrl:      z.string().url().max(512).optional(),
  monthlyPrice: z.number().int().min(0),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  expiresAt:    z.string().datetime({ offset: true }).optional(),
})

export const updateSubscriptionSchema = z.object({
  serviceName:  z.string().min(1).max(255).optional(),
  logoUrl:      z.string().url().max(512).optional().nullable(),
  monthlyPrice: z.number().int().min(0).optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
  expiresAt:    z.string().datetime({ offset: true }).optional().nullable(),
  isActive:     z.boolean().optional(),
})

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>
