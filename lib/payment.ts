import { apiUrl } from './api'

// ── Bank Transfer Config ────────────────────────────────────────────────────
export const BANK = {
  id: 'TCB',
  account: 'MS00T01275350543975',
  name: 'TRIEU NAM HAI',
}

export function vietQrUrl(amount: number, addInfo: string): string {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: BANK.name,
  })
  return `https://img.vietqr.io/image/${BANK.id}-${BANK.account}-compact2.jpg?${params.toString()}`
}

// ── Sepay ────────────────────────────────────────────────────────────────────

export const SEPAY_ENABLED = Boolean(
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SEPAY_ENABLED
    : (window as Window & { __SEPAY_ENABLED__?: string }).__SEPAY_ENABLED__ ??
      process.env.NEXT_PUBLIC_SEPAY_ENABLED
)

export interface SepayPaymentResult {
  paymentUrl: string
  transactionId: string
}

export async function createSepayOrderPayment(
  orderId: number,
  token?: string,
): Promise<SepayPaymentResult> {
  const res = await fetch(apiUrl(`/payment/order/${orderId}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Không thể tạo thanh toán Sepay')
  return { paymentUrl: json.data.paymentUrl, transactionId: json.data.transactionId }
}

export async function createSepayTopupPayment(
  amount: number,
  token: string,
): Promise<SepayPaymentResult> {
  const res = await fetch(apiUrl('/payment/topup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Không thể tạo thanh toán Sepay')
  return { paymentUrl: json.data.paymentUrl, transactionId: json.data.transactionId }
}

export type TransactionStatus = 'pending' | 'paid' | 'failed'

export async function getTransactionStatus(
  txId: string,
  token?: string,
): Promise<TransactionStatus> {
  const res = await fetch(apiUrl(`/payment/transaction/${txId}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const json = await res.json()
  return (json.data?.status ?? 'pending') as TransactionStatus
}

/**
 * Poll transaction status every 5s; calls onPaid when status becomes 'paid'.
 * Returns a stop function to cancel polling.
 */
export function pollTransactionStatus(
  txId: string,
  onPaid: () => void,
  token?: string,
): () => void {
  let stopped = false
  const tick = async () => {
    if (stopped) return
    try {
      const status = await getTransactionStatus(txId, token)
      if (status === 'paid') { onPaid(); return }
      if (status === 'failed') return
    } catch { /* continue polling on transient errors */ }
    if (!stopped) setTimeout(tick, 5000)
  }
  setTimeout(tick, 5000)
  return () => { stopped = true }
}
