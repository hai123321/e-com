import { z } from 'zod'

const paramsSchema = z.record(z.unknown())

export const createRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().default(''),
  ruleType: z.enum(['multiplier', 'fixed_add', 'stock_based', 'time_based', 'manual_override']),
  params: paramsSchema,
  scopeType: z.enum(['global', 'category', 'product']).default('global'),
  scopeValue: z.string().optional(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
})

export const updateRuleSchema = createRuleSchema.partial()

export type CreateRuleInput = z.infer<typeof createRuleSchema>
