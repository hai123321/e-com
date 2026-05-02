import { z } from 'zod'

export const createOrderPaymentSchema = z.object({
  orderId: z.number().int().positive(),
  amount:  z.number().int().positive(),
})

export const createTopupPaymentSchema = z.object({
  amount: z.number().int().min(10000, 'Số tiền nạp tối thiểu 10,000đ'),
})

export const ipnPayloadSchema = z.object({
  id:               z.number().optional(),
  gateway:          z.string().optional(),
  transactionDate:  z.string().optional(),
  accountNumber:    z.string().optional(),
  code:             z.string().optional(),
  content:          z.string().optional(),
  transferType:     z.string().optional(),
  transferAmount:   z.number().optional(),
  accumulated:      z.number().optional(),
  subAccount:       z.string().nullable().optional(),
  referenceCode:    z.string().optional(),
  description:      z.string().optional(),
}).passthrough()

export const transactionQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'paid', 'failed']).optional(),
  type:   z.enum(['order', 'topup']).optional(),
})

export type CreateOrderPaymentInput = z.infer<typeof createOrderPaymentSchema>
export type CreateTopupPaymentInput = z.infer<typeof createTopupPaymentSchema>
export type IpnPayload              = z.infer<typeof ipnPayloadSchema>
export type TransactionQuery        = z.infer<typeof transactionQuerySchema>
