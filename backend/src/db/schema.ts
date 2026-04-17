import {
  pgTable, serial, varchar, text, integer, boolean,
  timestamp, check, jsonb,
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
  groupKey:         varchar('group_key', { length: 100 }).notNull().default(''),
  featuredPriority: integer('featured_priority').notNull().default(0),
  isActive:         boolean('is_active').notNull().default(true),
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

export const guides = pgTable('guides', {
  id:            serial('id').primaryKey(),
  type:          varchar('type', { length: 255 }).notNull(),
  descriptionVi: text('description_vi').notNull().default(''),
  descriptionEn: text('description_en').notNull().default(''),
  descriptionCn: text('description_cn').notNull().default(''),
  isActive:      boolean('is_active').notNull().default(true),
  sortOrder:     integer('sort_order').notNull().default(0),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Guide    = typeof guides.$inferSelect
export type NewGuide = typeof guides.$inferInsert

// ── Users ──────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:           serial('id').primaryKey(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  name:         varchar('name', { length: 255 }).notNull().default(''),
  avatar:       varchar('avatar', { length: 512 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  googleId:     varchar('google_id', { length: 255 }).unique(),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Pricing Rules ───────────────────────────────────────────────────────────
export const pricingRules = pgTable('pricing_rules', {
  id:          serial('id').primaryKey(),
  name:        varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  ruleType:    varchar('rule_type', { length: 50 }).notNull(),
  params:      jsonb('params').notNull().default({}),
  scopeType:   varchar('scope_type', { length: 20 }).notNull().default('global'),
  scopeValue:  varchar('scope_value', { length: 255 }),
  priority:    integer('priority').notNull().default(0),
  isActive:    boolean('is_active').notNull().default(true),
  startsAt:    timestamp('starts_at', { withTimezone: true }),
  endsAt:      timestamp('ends_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Promotions ──────────────────────────────────────────────────────────────
export const promotions = pgTable('promotions', {
  id:            serial('id').primaryKey(),
  code:          varchar('code', { length: 50 }).notNull().unique(),
  discountType:  varchar('discount_type', { length: 10 }).notNull(),
  discountValue: integer('discount_value').notNull(),
  minOrderValue: integer('min_order_value'),
  maxUses:       integer('max_uses'),
  usedCount:     integer('used_count').notNull().default(0),
  isActive:      boolean('is_active').notNull().default(true),
  expiresAt:     timestamp('expires_at', { withTimezone: true }),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const banners = pgTable('banners', {
  id:        serial('id').primaryKey(),
  title:     varchar('title', { length: 255 }).notNull().default(''),
  subtitle:  varchar('subtitle', { length: 255 }).notNull().default(''),
  image:     varchar('image', { length: 512 }).notNull().default(''),
  href:      varchar('href', { length: 512 }).notNull().default('/#products'),
  priority:  integer('priority').notNull().default(0),
  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
export type Banner    = typeof banners.$inferSelect
export type NewBanner = typeof banners.$inferInsert
