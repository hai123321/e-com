import { listAllRules, listActiveRulesForProduct, getRuleById, createRule, updateRule, deleteRule } from './pricing.repository.js'
import type { NewPricingRule } from './pricing.repository.js'
import { applyRules } from './pricing.engine.js'
import { db } from '../../db/client.js'
import { products } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

export async function getAllRules() {
  return listAllRules()
}

export async function createPricingRule(data: NewPricingRule) {
  return createRule(data)
}

export async function updatePricingRule(id: number, data: Partial<NewPricingRule>) {
  const rule = await getRuleById(id)
  if (!rule) throw Object.assign(new Error('Pricing rule not found'), { statusCode: 404 })
  return updateRule(id, data)
}

export async function deletePricingRule(id: number) {
  const ok = await deleteRule(id)
  if (!ok) throw Object.assign(new Error('Pricing rule not found'), { statusCode: 404 })
}

export async function previewEffectivePrice(productId: number) {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  const rules = await listActiveRulesForProduct(productId, product.category)
  const rulesForEngine = rules.map(r => ({
    ...r,
    params: (r.params ?? {}) as Record<string, unknown>,
  }))
  const { finalPrice, appliedRules } = applyRules(product.price, rulesForEngine, {
    stock: product.stock,
    categoryName: product.category,
    productId,
  })
  return { productId, basePrice: product.price, effectivePrice: finalPrice, appliedRules }
}
