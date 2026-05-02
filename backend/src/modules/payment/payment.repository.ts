import { eq, desc, count, and, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { paymentTransactions, users, orders } from '../../db/schema.js'
import type { NewPaymentTransaction } from '../../db/schema.js'
import type { TransactionQuery } from './payment.schema.js'

export async function createTransaction(data: NewPaymentTransaction) {
  const [tx] = await db.insert(paymentTransactions).values(data).returning()
  return tx
}

export async function findTransactionById(id: number) {
  const [tx] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id))
  return tx ?? null
}

export async function findTransactionBySepayOrderId(sepayOrderId: string) {
  const [tx] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.sepayOrderId, sepayOrderId))
  return tx ?? null
}

export async function updateTransaction(
  id: number,
  data: Partial<Pick<NewPaymentTransaction, 'status' | 'sepayTxId' | 'ipnPayload'>>,
) {
  const [tx] = await db
    .update(paymentTransactions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(paymentTransactions.id, id))
    .returning()
  return tx ?? null
}

export async function incrementWalletBalance(userId: number, amount: number) {
  const [user] = await db
    .update(users)
    .set({
      walletBalance: sql`${users.walletBalance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ walletBalance: users.walletBalance })
  return user?.walletBalance ?? 0
}

export async function decrementWalletBalance(userId: number, amount: number) {
  const [user] = await db
    .update(users)
    .set({
      walletBalance: sql`GREATEST(${users.walletBalance} - ${amount}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ walletBalance: users.walletBalance })
  return user?.walletBalance ?? 0
}

export async function getWalletBalance(userId: number) {
  const [user] = await db
    .select({ walletBalance: users.walletBalance })
    .from(users)
    .where(eq(users.id, userId))
  return user?.walletBalance ?? 0
}

export async function listTransactions(query: TransactionQuery) {
  const { page, limit, status, type } = query
  const offset = (page - 1) * limit

  const conditions = []
  if (status) conditions.push(eq(paymentTransactions.status, status))
  if (type)   conditions.push(eq(paymentTransactions.type, type))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(paymentTransactions)
      .where(where)
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(paymentTransactions).where(where),
  ])

  return { rows, total: Number(total), page, limit }
}

export async function listUserTransactions(userId: number) {
  return db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.userId, userId))
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(50)
}
