import { z } from 'zod'

export const createOrderSchema = z.object({
  customerName:  z.string().min(1).max(255),
  customerPhone: z.string().min(9).max(20),
  customerEmail: z.string().email().optional(),
  note:          z.string().max(1000).optional(),
  userId:        z.number().int().positive().optional(),
  promoCode:     z.string().max(50).optional(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity:  z.number().int().positive(),
  })).min(1),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']),
})

export const orderQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']).optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateOrderInput   = z.infer<typeof createOrderSchema>
export type UpdateStatusInput  = z.infer<typeof updateOrderStatusSchema>
export type OrderQuery         = z.infer<typeof orderQuerySchema>
