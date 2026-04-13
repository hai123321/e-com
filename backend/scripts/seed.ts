import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { eq } from 'drizzle-orm'
import 'dotenv/config'
import { products, admins } from '../src/db/schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const db   = drizzle(pool)

// Run migrations first
console.log('📦 Running migrations...')
// dev: __dirname = /app/scripts  → ../drizzle = /app/drizzle
// prod: __dirname = /app/dist/scripts → ../../drizzle = /app/drizzle
await migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle') })

// ── Seed products from CSV ──────────────────────────────────────────────────
const [existingProduct] = await db.select().from(products).limit(1)
if (!existingProduct) {
  console.log('🌱 Seeding products from CSV...')
  const csvPath = resolve(__dirname, '../../data/products.csv')
  const csv     = readFileSync(csvPath, 'utf-8').trim()
  const lines   = csv.split('\n')
  const headers = lines[0].split(',').map((h) => h.trim())

  const rows = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim())
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]]))
  })

  await db.insert(products).values(
    rows.map((r) => ({
      name:        r.name,
      description: r.description ?? '',
      price:       parseInt(r.price),
      image:       r.image ?? '',
      stock:       parseInt(r.stock) || 0,
      category:    r.category ?? 'Khác',
    })),
  )
  console.log(`✅ Inserted ${rows.length} products`)
} else {
  console.log('⏭  Products already seeded, skipping')
}

// ── Seed admin ──────────────────────────────────────────────────────────────
const adminPassword = process.env.ADMIN_PASSWORD
if (!adminPassword) {
  console.warn('⚠️  ADMIN_PASSWORD not set, skipping admin seed')
} else {
  const [existingAdmin] = await db.select().from(admins).where(eq(admins.username, 'admin'))
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await db.insert(admins).values({ username: 'admin', passwordHash })
    console.log('✅ Admin user created (username: admin)')
  } else {
    console.log('⏭  Admin already exists, skipping')
  }
}

await pool.end()
console.log('🎉 Seed complete')
