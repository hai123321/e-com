import { eq, ilike, and, count, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { products } from '../../db/schema.js'
import type { CreateProductInput, UpdateProductInput, ProductQuery } from './products.schema.js'

export async function findProducts(query: ProductQuery, adminMode = false) {
  const { search, category, page, limit } = query
  const offset = (page - 1) * limit

  const conditions = [
    ...(!adminMode ? [eq(products.isActive, true)] : []),
    ...(search   ? [ilike(products.name, `%${search}%`)] : []),
    ...(category ? [eq(products.category, category)]     : []),
  ]

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(products).where(where).limit(limit).offset(offset)
      .orderBy(products.createdAt),
    db.select({ value: count() }).from(products).where(where),
  ])

  return { rows, total: Number(total), page, limit }
}

export async function findProductById(id: number) {
  const [row] = await db.select().from(products).where(eq(products.id, id))
  return row ?? null
}

export async function createProduct(input: CreateProductInput) {
  const [row] = await db.insert(products).values(input).returning()
  return row
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  const [row] = await db.update(products)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning()
  return row ?? null
}

export async function softDeleteProduct(id: number) {
  const [row] = await db.update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning()
  return row ?? null
}

export async function findProductsByGroupKey(groupKey: string) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.groupKey, groupKey), eq(products.isActive, true)))
    .orderBy(products.price)
}

export async function decrementStock(id: number, qty: number) {
  await db.update(products)
    .set({ stock: sql`${products.stock} - ${qty}`, updatedAt: new Date() })
    .where(and(eq(products.id, id), sql`${products.stock} >= ${qty}`))
}
