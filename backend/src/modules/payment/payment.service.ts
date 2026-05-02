import crypto from 'crypto'
import createError from '@fastify/error'
import { config } from '../../config.js'
import { db } from '../../db/client.js'
import { orders } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import {
  createTransaction,
  findTransactionBySepayOrderId,
  updateTransaction,
  incrementWalletBalance,
} from './payment.repository.js'
import type { IpnPayload } from './payment.schema.js'

const BadRequest = createError('FST_ERR_BAD_REQUEST', '%s', 400)
const NotFound   = createError('FST_ERR_NOT_FOUND',   '%s', 404)

function buildSepayOrderId(prefix: string, refId: number): string {
  return `${prefix}${refId}_${Date.now()}`
}

async function callSepayCreatePayment(params: {
  amount: number
  description: string
  sepayOrderId: string
}): Promise<{ paymentUrl: string }> {
  if (!config.SEPAY_API_URL || !config.SEPAY_MERCHANT_ID || !config.SEPAY_SECRET_KEY) {
    // Fallback: return VietQR deep link
    const bank = 'MB'
    const accountNo = config.SEPAY_MERCHANT_ID || '0000000000'
    const addInfo = encodeURIComponent(params.description)
    const paymentUrl = `https://img.vietqr.io/image/${bank}-${accountNo}-compact.png?amount=${params.amount}&addInfo=${addInfo}`
    return { paymentUrl }
  }

  const body = {
    merchantId:  config.SEPAY_MERCHANT_ID,
    amount:      params.amount,
    description: params.description,
    orderId:     params.sepayOrderId,
    returnUrl:   `${config.FRONTEND_URL}/payment/result`,
    cancelUrl:   `${config.FRONTEND_URL}/payment/cancel`,
  }

  const signature = crypto
    .createHmac('sha256', config.SEPAY_SECRET_KEY)
    .update(JSON.stringify(body))
    .digest('hex')

  const res = await fetch(`${config.SEPAY_API_URL}/v1/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new BadRequest(`Sepay API error: ${text}`)
  }

  const data = await res.json() as { paymentUrl?: string; payment_url?: string }
  const paymentUrl = data.paymentUrl ?? data.payment_url ?? ''
  if (!paymentUrl) throw new BadRequest('Sepay did not return a payment URL')
  return { paymentUrl }
}

export async function createOrderPayment(orderId: number, amount: number, userId?: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order) throw new NotFound('Order not found')
  if (order.status !== 'pending') throw new BadRequest('Order đã được xử lý')

  const sepayOrderId = buildSepayOrderId('ORD', orderId)
  const description  = `Thanh toan don hang #${orderId}`

  const { paymentUrl } = await callSepayCreatePayment({ amount, description, sepayOrderId })

  const tx = await createTransaction({
    orderId,
    userId: userId ?? null,
    type:   'order',
    amount,
    status: 'pending',
    sepayOrderId,
  })

  return { transaction: tx, paymentUrl }
}

export async function createTopupPayment(userId: number, amount: number) {
  const sepayOrderId = buildSepayOrderId('TOP', userId)
  const description  = `Nap tien vi MiuShop #${userId}`

  const { paymentUrl } = await callSepayCreatePayment({ amount, description, sepayOrderId })

  const tx = await createTransaction({
    orderId: null,
    userId,
    type:    'topup',
    amount,
    status:  'pending',
    sepayOrderId,
  })

  return { transaction: tx, paymentUrl }
}

export async function processIPN(payload: IpnPayload): Promise<void> {
  // Verify HMAC signature when Sepay is configured
  if (config.SEPAY_SECRET_KEY && payload.referenceCode) {
    const { referenceCode, ...rest } = payload
    const expected = crypto
      .createHmac('sha256', config.SEPAY_SECRET_KEY)
      .update(JSON.stringify(rest))
      .digest('hex')
    if (referenceCode !== expected) {
      throw new BadRequest('Invalid IPN signature')
    }
  }

  const sepayOrderId = payload.code ?? payload.description?.match(/\b(ORD|TOP)\d+_\d+/)?.[0]
  if (!sepayOrderId) return // Unrecognized IPN — ignore

  const tx = await findTransactionBySepayOrderId(sepayOrderId)
  if (!tx || tx.status === 'paid') return // Already processed or unknown

  const sepayTxId = String(payload.id ?? payload.referenceCode ?? '')
  await updateTransaction(tx.id, { status: 'paid', sepayTxId, ipnPayload: payload })

  if (tx.type === 'order' && tx.orderId) {
    await db
      .update(orders)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(orders.id, tx.orderId))
  } else if (tx.type === 'topup' && tx.userId) {
    await incrementWalletBalance(tx.userId, tx.amount)
  }
}
