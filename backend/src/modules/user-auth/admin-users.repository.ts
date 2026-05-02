import { eq, and, or, ilike, count, sql, desc, gte, lte, inArray } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { users, orders, orderItems, userSubscriptions, products } from '../../db/schema.js'

export interface UserListQuery {
  page: number
  limit: number
  search?: string
  isActive?: boolean
}

export async function listUsers(query: UserListQuery) {
  const { page, limit, search, isActive } = query
  const offset = (page - 1) * limit

  const baseConditions: (SQL | undefined)[] = []
  if (typeof isActive === 'boolean') {
    baseConditions.push(eq(users.isActive, isActive))
  }
  if (search) {
    baseConditions.push(or(ilike(users.email, `%${search}%`), ilike(users.name, `%${search}%`)))
  }

  const where = baseConditions.length > 0 ? and(...baseConditions) : undefined

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ])

  if (rows.length === 0) return { rows: [], total: Number(total), page, limit }

  const userIds = rows.map(r => r.id)

  const [spentRows, orderCountRows, subCountRows] = await Promise.all([
    db.select({
      userId: orders.userId,
      totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
    }).from(orders)
      .where(and(inArray(orders.userId, userIds), eq(orders.status, 'delivered')))
      .groupBy(orders.userId),
    db.select({
      userId: orders.userId,
      orderCount: count(),
    }).from(orders)
      .where(inArray(orders.userId, userIds))
      .groupBy(orders.userId),
    db.select({
      userId: userSubscriptions.userId,
      subscriptionCount: count(),
    }).from(userSubscriptions)
      .where(inArray(userSubscriptions.userId, userIds))
      .groupBy(userSubscriptions.userId),
  ])

  const spentMap = new Map(spentRows.map(r => [r.userId, Number(r.totalSpent)]))
  const orderMap = new Map(orderCountRows.map(r => [r.userId, Number(r.orderCount)]))
  const subMap   = new Map(subCountRows.map(r => [r.userId, Number(r.subscriptionCount)]))

  const enriched = rows.map(u => ({
    ...u,
    walletBalance: 0,
    totalSpent: spentMap.get(u.id) ?? 0,
    orderCount: orderMap.get(u.id) ?? 0,
    subscriptionCount: subMap.get(u.id) ?? 0,
  }))

  return { rows: enriched, total: Number(total), page, limit }
}

export async function getUserDetail(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id))
  if (!user) return null

  const [userOrders, userSubs] = await Promise.all([
    db.select().from(orders)
      .where(eq(orders.userId, id))
      .orderBy(desc(orders.createdAt))
      .limit(50),
    db.select({
      id: userSubscriptions.id,
      serviceName: userSubscriptions.serviceName,
      logoUrl: userSubscriptions.logoUrl,
      monthlyPrice: userSubscriptions.monthlyPrice,
      billingCycle: userSubscriptions.billingCycle,
      expiresAt: userSubscriptions.expiresAt,
      source: userSubscriptions.source,
      isActive: userSubscriptions.isActive,
      createdAt: userSubscriptions.createdAt,
    }).from(userSubscriptions)
      .where(eq(userSubscriptions.userId, id))
      .orderBy(desc(userSubscriptions.createdAt)),
  ])

  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
      return { ...order, items }
    }),
  )

  return {
    ...user,
    walletBalance: 0,
    orders: ordersWithItems,
    subscriptions: userSubs,
  }
}

export async function getUserStats(id: number) {
  const [basicStats] = await db.select({
    totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
    totalOrders: sql<number>`count(*)`,
    avgOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)`,
  }).from(orders)
    .where(and(eq(orders.userId, id), eq(orders.status, 'delivered')))

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [monthlyRows, topProductRows] = await Promise.all([
    db.select({
      month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
      amount: sql<number>`coalesce(sum(${orders.total}), 0)`,
    }).from(orders)
      .where(and(
        eq(orders.userId, id),
        eq(orders.status, 'delivered'),
        gte(orders.createdAt, sixMonthsAgo),
      ))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`),

    db.select({
      productName: orderItems.productName,
      orderCount: count(),
      amount: sql<number>`coalesce(sum(${orderItems.productPrice} * ${orderItems.quantity}), 0)`,
    }).from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orders.userId, id), eq(orders.status, 'delivered')))
      .groupBy(orderItems.productName)
      .orderBy(desc(count()))
      .limit(5),
  ])

  return {
    totalSpent: Number(basicStats?.totalSpent ?? 0),
    totalOrders: Number(basicStats?.totalOrders ?? 0),
    avgOrderValue: Math.round(Number(basicStats?.avgOrderValue ?? 0)),
    monthlySpending: monthlyRows.map(r => ({ month: r.month, amount: Number(r.amount) })),
    topProducts: topProductRows.map(r => ({
      productName: r.productName,
      count: Number(r.orderCount),
      amount: Number(r.amount),
    })),
  }
}

export async function setUserStatus(id: number, isActive: boolean) {
  const [user] = await db.update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
  return user ?? null
}

export async function setUserPassword(id: number, passwordHash: string) {
  const [user] = await db.update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
  return user ?? null
}

export async function getExpiringSubscriptions(withinDays: number) {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + withinDays)

  const rows = await db.select({
    userId: userSubscriptions.userId,
    userName: users.name,
    userEmail: users.email,
    userPhone: users.phone,
    serviceName: userSubscriptions.serviceName,
    expiresAt: userSubscriptions.expiresAt,
    suggestedProductId: userSubscriptions.miuSuggestedProductId,
    suggestedProductName: products.name,
  }).from(userSubscriptions)
    .innerJoin(users, eq(users.id, userSubscriptions.userId))
    .leftJoin(products, eq(products.id, userSubscriptions.miuSuggestedProductId))
    .where(and(
      eq(userSubscriptions.isActive, true),
      gte(userSubscriptions.expiresAt, now),
      lte(userSubscriptions.expiresAt, future),
    ))
    .orderBy(userSubscriptions.expiresAt)

  return rows
}
