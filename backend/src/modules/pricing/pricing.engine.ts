export type RuleType = 'multiplier' | 'fixed_add' | 'stock_based' | 'time_based' | 'manual_override'

export interface PricingRule {
  id: number
  ruleType: string
  params: Record<string, unknown>
  scopeType: string
  scopeValue: string | null
  priority: number
  isActive: boolean
  startsAt: Date | null
  endsAt: Date | null
}

export interface ApplyContext {
  now?: Date
  stock?: number
  categoryName?: string
  productId?: number
}

export interface AppliedRule {
  id: number
  name: string
  delta: number
}

export function applyRules(
  basePrice: number,
  rules: (PricingRule & { name: string })[],
  context: ApplyContext = {}
): { finalPrice: number; appliedRules: AppliedRule[] } {
  const now = context.now ?? new Date()
  const stock = context.stock ?? 0

  // Filter active rules within time window
  const active = rules.filter(r => {
    if (!r.isActive) return false
    if (r.startsAt && r.startsAt > now) return false
    if (r.endsAt && r.endsAt < now) return false
    return true
  })

  // Check manual_override first (highest priority)
  const overrides = active.filter(r => r.ruleType === 'manual_override')
  if (overrides.length > 0) {
    const rule = overrides.sort((a, b) => b.priority - a.priority)[0]
    const p = rule.params as { fixed_price: number }
    return {
      finalPrice: Math.max(0, p.fixed_price),
      appliedRules: [{ id: rule.id, name: rule.name, delta: p.fixed_price - basePrice }],
    }
  }

  // Sort remaining by scope specificity then priority
  const scopeOrder = { product: 3, category: 2, global: 1 }
  const sorted = active
    .filter(r => r.ruleType !== 'manual_override')
    .sort((a, b) => {
      const scopeDiff = (scopeOrder[b.scopeType as keyof typeof scopeOrder] ?? 0) -
                        (scopeOrder[a.scopeType as keyof typeof scopeOrder] ?? 0)
      return scopeDiff !== 0 ? scopeDiff : b.priority - a.priority
    })

  let price = basePrice
  const applied: AppliedRule[] = []

  for (const rule of sorted) {
    const before = price

    if (rule.ruleType === 'multiplier') {
      const p = rule.params as { factor: number }
      price = Math.round(price * (p.factor ?? 1))
    } else if (rule.ruleType === 'fixed_add') {
      const p = rule.params as { amount: number }
      price = price + (p.amount ?? 0)
    } else if (rule.ruleType === 'stock_based') {
      const p = rule.params as { tiers: { min_stock: number; discount_percent: number }[] }
      const tier = (p.tiers ?? [])
        .sort((a, b) => b.min_stock - a.min_stock)
        .find(t => stock >= t.min_stock)
      if (tier && tier.discount_percent > 0) {
        price = Math.round(price * (1 - tier.discount_percent / 100))
      }
    } else if (rule.ruleType === 'time_based') {
      const p = rule.params as { schedule: { days: number[]; hours?: number[]; discount_percent: number }[] }
      const day = now.getDay()
      const hour = now.getHours()
      const match = (p.schedule ?? []).find(s =>
        s.days.includes(day) && (!s.hours || s.hours.includes(hour))
      )
      if (match && match.discount_percent > 0) {
        price = Math.round(price * (1 - match.discount_percent / 100))
      }
    }

    const delta = price - before
    if (delta !== 0) {
      applied.push({ id: rule.id, name: rule.name, delta })
    }
  }

  return { finalPrice: Math.max(0, price), appliedRules: applied }
}
