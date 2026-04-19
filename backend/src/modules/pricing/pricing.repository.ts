import { eq, and, or } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { pricingRules } from '../../db/schema.js'

export type PricingRule = typeof pricingRules.$inferSelect
export type NewPricingRule = typeof pricingRules.$inferInsert

export async function listAllRules(): Promise<PricingRule[]> {
  return db.select().from(pricingRules).orderBy(pricingRules.priority)
}

export async function listActiveRulesForProduct(
  productId: number,
  categoryName: string,
  groupKey = ''
): Promise<PricingRule[]> {
  // Fetch all active rules and filter in memory so we can handle the
  // comma-separated multi-group scopeValue without a DB-level string split.
  const all = await db.select().from(pricingRules).where(eq(pricingRules.isActive, true))
  return all.filter(r => {
    if (r.scopeType === 'global') return true
    if (r.scopeType === 'category') return r.scopeValue === categoryName
    if (r.scopeType === 'product')  return r.scopeValue === String(productId)
    if (r.scopeType === 'group') {
      const keys = (r.scopeValue ?? '').split(',').map(k => k.trim()).filter(Boolean)
      return keys.includes(groupKey)
    }
    return false
  })
}

export async function getRuleById(id: number): Promise<PricingRule | null> {
  const [rule] = await db.select().from(pricingRules).where(eq(pricingRules.id, id)).limit(1)
  return rule ?? null
}

export async function createRule(data: NewPricingRule): Promise<PricingRule> {
  const [rule] = await db.insert(pricingRules).values(data).returning()
  return rule
}

export async function updateRule(id: number, data: Partial<NewPricingRule>): Promise<PricingRule | null> {
  const [rule] = await db.update(pricingRules).set({ ...data, updatedAt: new Date() }).where(eq(pricingRules.id, id)).returning()
  return rule ?? null
}

export async function deleteRule(id: number): Promise<boolean> {
  const result = await db.delete(pricingRules).where(eq(pricingRules.id, id)).returning()
  return result.length > 0
}
