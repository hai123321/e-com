import { z } from 'zod'

export const createProductSchema = z.object({
  name:             z.string().min(1).max(255),
  description:      z.string().default(''),
  price:            z.number().int().positive(),
  image:            z.string().url().or(z.string().default('')),
  stock:            z.number().int().min(0).default(0),
  category:         z.string().default('Streaming'),
  groupKey:         z.string().max(100).default(''),
  featuredPriority: z.number().int().min(0).max(100).default(0),
  durationMonths:   z.number().int().refine(v => [1, 3, 6, 12].includes(v)).default(1),
})

export const updateProductSchema = createProductSchema.partial().extend({
  isActive:   z.boolean().optional(),
  salePrice:  z.number().int().positive().nullable().optional(),
  saleEndsAt: z.union([z.string(), z.null(), z.undefined()])
    .transform((v): Date | null => (v && v !== '') ? new Date(v) : null)
    .optional(),
})

export const setFlashSaleSchema = z.object({
  salePrice:  z.number().int().positive(),
  saleEndsAt: z.string().transform((v) => new Date(v)),
})

export const clearFlashSaleSchema = z.object({})

export const productQuerySchema = z.object({
  search:   z.string().optional(),
  category: z.string().optional(),
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().min(1).max(500).default(200),
})

export type CreateProductInput  = z.infer<typeof createProductSchema>
export type UpdateProductInput  = z.infer<typeof updateProductSchema>
export type ProductQuery        = z.infer<typeof productQuerySchema>
export type SetFlashSaleInput   = z.infer<typeof setFlashSaleSchema>
