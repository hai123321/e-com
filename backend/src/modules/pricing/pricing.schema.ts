import { z } from 'zod'

const paramsSchema = z.record(z.unknown())

/**
 * Accept any datetime string the browser might send (datetime-local = "YYYY-MM-DDTHH:mm",
 * full ISO with Z, etc.) and coerce to a Date. Empty string or null/undefined → null (unlimited).
 */
const flexDatetime = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v): Date | null => {
    if (!v || v === '') return null
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  })
  .optional()

export const createRuleSchema = z.object({
  name:        z.string().min(1).max(255),
  description: z.string().default(''),
  ruleType:    z.enum(['multiplier', 'fixed_add', 'stock_based', 'time_based', 'manual_override']),
  params:      paramsSchema,
  scopeType:   z.enum(['global', 'category', 'product', 'group']).default('global'),
  scopeValue:  z.string().optional(),
  priority:    z.number().int().default(0),
  isActive:    z.boolean().default(true),
  startsAt:    flexDatetime,
  endsAt:      flexDatetime,
})

export const updateRuleSchema = createRuleSchema.partial()

export type CreateRuleInput = z.infer<typeof createRuleSchema>
