import { eq, and, count, sql, desc } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { orders, orderItems, products } from '../../db/schema.js'
import type { CreateOrderInput, OrderQuery } from './orders.schema.js'

export async function createOrder(input: CreateOrderInput) {
  return db.transaction(async (tx) => {
    // 1. Lock rows and validate stock for all items
    const productIds = input.items.map((i) => i.productId)
    const rows = await tx.select()
      .from(products)
      .where(sql`${products.id} = ANY(${productIds}) AND ${products.isActive} = true`)

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

    // 2. Calculate total
    const total = input.items.reduce((sum, item) => {
      const p = rows.find((r) => r.id === item.productId)!
      return sum + p.price * item.quantity
    }, 0)

    // 3. Insert order
    const [order] = await tx.insert(orders).values({
      customerName:  input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      note:          input.note,
      total,
    }).returning()

    // 4. Insert order items + decrement stock
    await tx.insert(orderItems).values(
      input.items.map((item) => {
        const p = rows.find((r) => r.id === item.productId)!
        return {
          orderId:      order.id,
          productId:    item.productId,
          productName:  p.name,
          productPrice: p.price,
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
