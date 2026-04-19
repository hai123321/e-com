import { eq, and, inArray, count, sql, desc } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { orders, orderItems, products } from '../../db/schema.js'
import type { CreateOrderInput, OrderQuery } from './orders.schema.js'
import { listAllRules } from '../pricing/pricing.repository.js'
import { applyRules } from '../pricing/pricing.engine.js'

// ── Pricing helpers (mirrors products.service logic) ─────────────────────────

type ActiveRule = Awaited<ReturnType<typeof listAllRules>>[number]

async function loadActiveRules(): Promise<ActiveRule[]> {
  const all = await listAllRules()
  const now = new Date()
  return all.filter(r => {
    if (!r.isActive) return false
    if (r.startsAt && r.startsAt > now) return false
    if (r.endsAt   && r.endsAt   < now) return false
    return true
  })
}

function computeEffectivePrice(
  product: { id: number; price: number; stock: number; category: string; groupKey: string | null },
  rules: ActiveRule[],
): number {
  const relevant = rules.filter(r => {
    if (r.scopeType === 'global')   return true
    if (r.scopeType === 'category') return r.scopeValue === product.category
    if (r.scopeType === 'product')  return r.scopeValue === String(product.id)
    if (r.scopeType === 'group') {
      const keys = (r.scopeValue ?? '').split(',').map(k => k.trim()).filter(Boolean)
      return keys.includes(product.groupKey ?? '')
    }
    return false
  })
  if (relevant.length === 0) return product.price
  const { finalPrice } = applyRules(
    product.price,
    relevant as Parameters<typeof applyRules>[1],
    { stock: product.stock, categoryName: product.category, productId: product.id },
  )
  return finalPrice
}

// ── Order CRUD ────────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput) {
  // Load pricing rules BEFORE entering the transaction (read-only, no need to lock)
  const activeRules = await loadActiveRules()

  return db.transaction(async (tx) => {
    // 1. Fetch product rows and validate stock
    const productIds = input.items.map((i) => i.productId)
    const rows = await tx.select()
      .from(products)
      .where(and(
        inArray(products.id, productIds),
        eq(products.isActive, true),
      ))

    for (const item of input.items) {
      const product = rows.find((p) => p.id === item.productId)
      if (!product) throw Object.assign(new Error(`Product ${item.productId} not found`), { statusCode: 404 })
      if (product.stock < item.quantity) {
        throw Object.assign(
          new Error(`Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho`),
          { statusCode: 409 },
        )
      }
    }

    // 2. Calculate total with pricing rules applied
    const total = input.items.reduce((sum, item) => {
      const p = rows.find((r) => r.id === item.productId)!
      const effectivePrice = computeEffectivePrice(p, activeRules)
      return sum + effectivePrice * item.quantity
    }, 0)

    // 3. Insert order
    const [order] = await tx.insert(orders).values({
      customerName:  input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      note:          input.note,
      total,
    }).returning()

    // 4. Insert order items (store effective price) + decrement stock
    await tx.insert(orderItems).values(
      input.items.map((item) => {
        const p = rows.find((r) => r.id === item.productId)!
        return {
          orderId:      order.id,
          productId:    item.productId,
          productName:  p.name,
          productPrice: computeEffectivePrice(p, activeRules),
          quantity:     item.quantity,
        }
      }),
    )

    for (const item of input.items) {
      await tx.update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId))
    }

    return order
  })
}

export async function findOrders(query: OrderQuery) {
  const { status, page, limit } = query
  const offset = (page - 1) * limit
  const where = status ? eq(orders.status, status) : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(orders).where(where).limit(limit).offset(offset)
      .orderBy(sql`${orders.createdAt} DESC`),
    db.select({ value: count() }).from(orders).where(where),
  ])

  return { rows, total: Number(total), page, limit }
}

export async function findOrderById(id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order) return null
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
  return { ...order, items }
}

export async function updateOrderStatus(id: number, status: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning()
    if (!row) return null

    if (status === 'delivered') {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id))
      for (const item of items) {
        await tx.update(products)
          .set({ soldCount: sql`${products.soldCount} + ${item.quantity}` })
          .where(eq(products.id, item.productId))
      }
    }

    return row
  })
}

export async function findOrdersByPhone(phone: string) {
  const rows = await db.select().from(orders)
    .where(eq(orders.customerPhone, phone))
    .orderBy(desc(orders.createdAt))
    .limit(50)

  return Promise.all(
    rows.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
      return { ...order, items }
    }),
  )
}

export async function findOrdersByEmail(email: string) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.customerEmail, email))
    .orderBy(desc(orders.createdAt))
    .limit(50)

  const withItems = await Promise.all(
    rows.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
      return { ...order, items }
    }),
  )
  return withItems
}

export async function getDashboardStats() {
  const [[{ total: totalOrders }], [{ total: totalRevenue }], [{ total: totalProducts }]] =
    await Promise.all([
      db.select({ total: count() }).from(orders),
      db.select({ total: sql<number>`coalesce(sum(total), 0)` }).from(orders)
        .where(eq(orders.status, 'delivered')),
      db.select({ total: count() }).from(products).where(eq(products.isActive, true)),
    ])

  return {
    totalOrders:   Number(totalOrders),
    totalRevenue:  Number(totalRevenue),
    totalProducts: Number(totalProducts),
  }
}
