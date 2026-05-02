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

function buildSepayOrderId(prefix: string, refId: number): string {
  return `${prefix}${refId}_${Date.now()}`
}

async function callSepayCreatePayment(params: {
  amount: number
  description: string
  sepayOrderId: string
}): Promise<{ paymentUrl: string; sepayCode?: string }> {
  if (!config.SEPAY_API_URL || !config.SEPAY_MERCHANT_ID || !config.SEPAY_SECRET_KEY) {
    // Fallback: return VietQR deep link — no SePay code available
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

  // SePay returns the generated payment code (e.g. "MSA1A1A1") in code / paymentCode field
  const data = await res.json() as {
    paymentUrl?: string; payment_url?: string
    code?: string; paymentCode?: string; transaction_code?: string
  }
  const paymentUrl = data.paymentUrl ?? data.payment_url ?? ''
  if (!paymentUrl) throw new BadRequest('Sepay did not return a payment URL')
  const sepayCode = data.code ?? data.paymentCode ?? data.transaction_code
  return { paymentUrl, sepayCode }
}

export async function createOrderPayment(orderId: number, amount: number, userId?: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order) throw new NotFound('Order not found')
  if (order.status !== 'pending') throw new BadRequest('Order đã được xử lý')

  const internalOrderId = buildSepayOrderId('ORD', orderId)
  const description     = `Thanh toan don hang order-${String(orderId).padStart(6, '0')}`

  const { paymentUrl, sepayCode } = await callSepayCreatePayment({
    amount,
    description,
    sepayOrderId: internalOrderId,
  })

  // Prefer the SePay-generated payment code (e.g. "MSA1A1A1") so IPN lookup works;
  // fall back to our own internal ID when SePay doesn't return one (VietQR mode).
  const tx = await createTransaction({
    orderId,
    userId: userId ?? null,
    type:   'order',
    amount,
    status: 'pending',
    sepayOrderId: sepayCode ?? internalOrderId,
  })

  return { transaction: tx, paymentUrl }
}

export async function createTopupPayment(userId: number, amount: number) {
  const internalOrderId = buildSepayOrderId('TOP', userId)
  const description     = `Nap tien vi MiuShop user-${userId}`

  const { paymentUrl, sepayCode } = await callSepayCreatePayment({
    amount,
    description,
    sepayOrderId: internalOrderId,
  })

  const tx = await createTransaction({
    orderId: null,
    userId,
    type:    'topup',
    amount,
    status:  'pending',
    sepayOrderId: sepayCode ?? internalOrderId,
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
