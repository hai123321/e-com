import {
  pgTable, serial, varchar, text, integer, boolean,
  timestamp, check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const products = pgTable('products', {
  id:          serial('id').primaryKey(),
  name:        varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  price:       integer('price').notNull(),
  image:       varchar('image', { length: 512 }).notNull().default(''),
  stock:       integer('stock').notNull().default(0),
  category:    varchar('category', { length: 100 }).notNull().default('Streaming'),
  isActive:    boolean('is_active').notNull().default(true),
  salePrice:   integer('sale_price'),
  saleEndsAt:  timestamp('sale_ends_at', { withTimezone: true }),
  soldCount:   integer('sold_count').notNull().default(0),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('stock_non_negative', sql`${t.stock} >= 0`),
])

export const orders = pgTable('orders', {
  id:            serial('id').primaryKey(),
  customerName:  varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  status:        varchar('status', { length: 50 }).notNull().default('pending'),
  total:         integer('total').notNull(),
  note:          text('note'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id:           serial('id').primaryKey(),
  orderId:      integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId:    integer('product_id').notNull().references(() => products.id),
  productName:  varchar('product_name', { length: 255 }).notNull(),
  productPrice: integer('product_price').notNull(),
  quantity:     integer('quantity').notNull(),
}, (t) => [
  check('quantity_positive', sql`${t.quantity} > 0`),
])

export const admins = pgTable('admins', {
  id:           serial('id').primaryKey(),
  username:     varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Product   = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Order     = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type Admin     = typeof admins.$inferSelect
