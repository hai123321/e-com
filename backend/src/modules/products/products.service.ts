import * as repo from './products.repository.js'
import type { CreateProductInput, UpdateProductInput, ProductQuery } from './products.schema.js'
import { listAllRules } from '../pricing/pricing.repository.js'
import { applyRules } from '../pricing/pricing.engine.js'
import type { PricingRule } from '../pricing/pricing.repository.js'

// ── Pricing helpers ─────────────────────────────────────────────────────────

type RuleWithName = PricingRule & { name: string }

/**
 * Fetch all active pricing rules once, then apply them per-product in memory.
 * This avoids N+1 DB queries when listing many products.
 */
async function getActiveRules(): Promise<RuleWithName[]> {
  const all = await listAllRules()
  const now = new Date()
  return (all as RuleWithName[]).filter(r => {
    if (!r.isActive) return false
    if (r.startsAt && r.startsAt > now) return false
    if (r.endsAt   && r.endsAt   < now) return false
    return true
  })
}

function rulesForProduct(
  rules: RuleWithName[],
  productId: number,
  category: string,
  groupKey: string
): RuleWithName[] {
  return rules.filter(r => {
    if (r.scopeType === 'global') return true
    if (r.scopeType === 'category') return r.scopeValue === category
    if (r.scopeType === 'product')  return r.scopeValue === String(productId)
    if (r.scopeType === 'group') {
      // scopeValue may hold a single key or a comma-separated list (multi-select)
      const keys = (r.scopeValue ?? '').split(',').map(k => k.trim()).filter(Boolean)
      return keys.includes(groupKey)
    }
    return false
  })
}

type AnyProduct = { id: number | string; price: number; stock: number; category: string; groupKey?: string }

function applyToProduct<T extends AnyProduct>(product: T, rules: RuleWithName[]): T {
  const relevant = rulesForProduct(rules, Number(product.id), product.category ?? '', product.groupKey ?? '')
  if (relevant.length === 0) return product
  const { finalPrice } = applyRules(product.price, relevant as Parameters<typeof applyRules>[1], {
    stock: product.stock,
    categoryName: product.category,
    productId: Number(product.id),
  })
  return { ...product, price: finalPrice }
}

// ── Public service functions ────────────────────────────────────────────────

export async function listProducts(query: ProductQuery, adminMode = false) {
  const { rows, total, page, limit } = await repo.findProducts(query, adminMode)

  // In admin mode show raw prices so admins see the original DB values
  if (adminMode) {
    return { data: rows, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  const rules = await getActiveRules()
  const priced = rows.map(p => applyToProduct(p, rules))
  return { data: priced, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
}

export async function getProduct(id: number) {
  const product = await repo.findProductById(id)
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  const rules = await getActiveRules()
  return applyToProduct(product, rules)
}

export async function listProductsByGroup(groupKey: string) {
  const rows = await repo.findProductsByGroupKey(groupKey)
  if (rows.length === 0) throw Object.assign(new Error('Group not found'), { statusCode: 404 })
  const rules = await getActiveRules()
  return rows.map(p => applyToProduct(p, rules))
}

export async function createProduct(input: CreateProductInput) {
  return repo.createProduct(input)
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  const product = await repo.updateProduct(id, input)
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  return product
}

export async function deleteProduct(id: number) {
  const product = await repo.softDeleteProduct(id)
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
}
