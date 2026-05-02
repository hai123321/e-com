import crypto from 'crypto'
import createError from '@fastify/error'
import { config } from '../../config.js'
import { db } from '../../db/client.js'
import { orders } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import {
  createTransaction,
  findTransactionBySepayOrderId,
  findPendingTransactionByOrderId,
  updateTransaction,
  incrementWalletBalance,
} from './payment.repository.js'
import type { IpnPayload } from './payment.schema.js'

const BadRequest = createError('FST_ERR_BAD_REQUEST', '%s', 400)
const NotFound   = createError('FST_ERR_NOT_FOUND',   '%s', 404)

/** Generate an MS-format payment code, e.g. "MS3F9K2A" */
function generateMsCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'MS'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function callSepayCreatePayment(params: {
  amount: number
  description: string
  msCode: string        // pre-generated MS code used as orderId and QR addInfo
}): Promise<{ paymentUrl: string; sepayCode: string }> {
  if (!config.SEPAY_API_URL || !config.SEPAY_MERCHANT_ID || !config.SEPAY_SECRET_KEY) {
    // Fallback: VietQR with TPBank — use our own MS code as addInfo
    const paymentUrl = `https://img.vietqr.io/image/TPB-00450820302-compact2.png?amount=${params.amount}&addInfo=${params.msCode}`
    return { paymentUrl, sepayCode: params.msCode }
  }

  const body = {
    merchantId:  config.SEPAY_MERCHANT_ID,
    amount:      params.amount,
    description: params.description,
    orderId:     params.msCode,
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

  // SePay may return its own payment code — prefer that, otherwise keep our MS code
  const data = await res.json() as {
    paymentUrl?: string; payment_url?: string
    code?: string; paymentCode?: string; transaction_code?: string
  }
  const paymentUrl = data.paymentUrl ?? data.payment_url ?? ''
  if (!paymentUrl) throw new BadRequest('Sepay did not return a payment URL')
  const sepayCode = data.code ?? data.paymentCode ?? data.transaction_code ?? params.msCode
  return { paymentUrl, sepayCode }
}

export async function createOrderPayment(orderId: number, amount: number, userId?: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order) throw new NotFound('Order not found')
  if (order.status !== 'pending') throw new BadRequest('Order đã được xử lý')

  const msCode      = generateMsCode()
  const description = `Thanh toan don hang ${msCode}`

  const { paymentUrl, sepayCode } = await callSepayCreatePayment({ amount, description, msCode })

  const tx = await createTransaction({
    orderId,
    userId: userId ?? null,
    type:   'order',
    amount,
    status: 'pending',
    sepayOrderId: sepayCode,   // always MS-format now
  })

  return { transaction: tx, paymentUrl }
}

export async function createTopupPayment(userId: number, amount: number) {
  const msCode      = generateMsCode()
  const description = `Nap tien vi MiuShop ${msCode}`

  const { paymentUrl, sepayCode } = await callSepayCreatePayment({ amount, description, msCode })

  const tx = await createTransaction({
    orderId: null,
    userId,
    type:    'topup',
    amount,
    status:  'pending',
    sepayOrderId: sepayCode,   // always MS-format now
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

  // ── Strategy 1: SePay payment code (e.g. "MSA1A1A1") stored as sepayOrderId ─
  let tx = payload.code
    ? await findTransactionBySepayOrderId(payload.code)
    : null

  // ── Strategy 2: Our internal ID pattern in description (legacy / fallback) ──
  if (!tx) {
    const text = payload.content ?? payload.description ?? ''
    const internalMatch = text.match(/\b(ORD|TOP)\d+_\d+\b/)
    if (internalMatch) {
      tx = await findTransactionBySepayOrderId(internalMatch[0])
    }
  }

  // ── Strategy 3: VietQR order code "order-XXXXXX" in transfer content ────────
  if (!tx) {
    const text = payload.content ?? payload.description ?? ''
    const orderMatch = text.match(/order-0*(\d+)/i)
    if (orderMatch) {
      const orderId = parseInt(orderMatch[1], 10)
      tx = await findPendingTransactionByOrderId(orderId)
    }
  }

  if (!tx || tx.status === 'paid') return // Already processed or unrecognized

  const sepayTxId = String(payload.id ?? payload.referenceCode ?? '')
  await updateTransaction(tx.id, { status: 'paid', sepayTxId, ipnPayload: payload })

  if (tx.type === 'order' && tx.orderId) {
    await db
      .update(orders)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(eq(orders.id, tx.orderId))
  } else if (tx.type === 'topup' && tx.userId) {
    await incrementWalletBalance(tx.userId, tx.amount)
  }
}
