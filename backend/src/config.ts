import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  NODE_ENV:      z.enum(['development', 'production', 'test']).default('development'),
  PORT:          z.coerce.number().default(3001),
  DATABASE_URL:  z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET:    z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CORS_ORIGIN:   z.string().default('http://localhost:3000'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters').optional(),
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM:    z.string().default('MiuShop <no-reply@miushop.io.vn>'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
