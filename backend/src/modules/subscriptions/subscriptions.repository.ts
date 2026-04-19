import { eq, and, ilike, asc } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { userSubscriptions, products, orders, orderItems } from '../../db/schema.js'
import type { NewUserSubscription } from '../../db/schema.js'

export async function getSubscriptionsByUser(userId: number) {
  return db.select().from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .orderBy(asc(userSubscriptions.createdAt))
}

export async function getSubscriptionById(id: number, userId: number) {
  const [row] = await db.select().from(userSubscriptions)
    .where(and(eq(userSubscriptions.id, id), eq(userSubscriptions.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function createSubscription(data: NewUserSubscription) {
  const [row] = await db.insert(userSubscriptions).values(data).returning()
  return row
}

export async function updateSubscription(
  id: number,
  userId: number,
  data: Partial<NewUserSubscription>,
) {
  const [row] = await db.update(userSubscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(userSubscriptions.id, id), eq(userSubscriptions.userId, userId)))
    .returning()
  return row ?? null
}

export async function deleteSubscription(id: number, userId: number) {
  const result = await db.delete(userSubscriptions)
    .where(and(eq(userSubscriptions.id, id), eq(userSubscriptions.userId, userId)))
    .returning({ id: userSubscriptions.id })
  return result.length > 0
}

export async function subscriptionExistsByOrderId(miushopOrderId: number) {
  const [row] = await db.select({ id: userSubscriptions.id })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.miushopOrderId, miushopOrderId))
    .limit(1)
  return !!row
}

export async function getStreamingProducts() {
  return db.select().from(products)
    .where(eq(products.isActive, true))
}

export async function getOrderItemsForUserByEmail(email: string) {
  return db
    .select({
      orderId:      orders.id,
      productId:    products.id,
      productName:  products.name,
      productPrice: products.price,
      category:     products.category,
      image:        products.image,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orders.customerEmail, email))
}

export async function findProductByFuzzyName(name: string) {
  const rows = await db.select().from(products)
    .where(and(
      ilike(products.name, `%${name}%`),
      eq(products.isActive, true),
    ))
    .limit(1)
  return rows[0] ?? null
}
