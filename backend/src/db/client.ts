import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { config } from '../config.js'
import * as schema from './schema.js'

const pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 10 })

export const db = drizzle(pool, { schema })

export async function checkDbConnection(): Promise<void> {
  const client = await pool.connect()
  await client.query('SELECT 1')
  client.release()
}
