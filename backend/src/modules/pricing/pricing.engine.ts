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

  // Scope specificity: product > group > category > global
  // Within the same scope, higher priority number wins.
  // Strategy: apply only the SINGLE most-specific / highest-priority rule
  // ("first match wins") — a product that hits a group rule will NOT also
  // pick up a global rule stacked on top.
  const scopeOrder: Record<string, number> = { product: 4, group: 3, category: 2, global: 1 }
  const sorted = active
    .filter(r => r.ruleType !== 'manual_override')
    .sort((a, b) => {
      const scopeDiff = (scopeOrder[b.scopeType] ?? 0) - (scopeOrder[a.scopeType] ?? 0)
      return scopeDiff !== 0 ? scopeDiff : b.priority - a.priority
    })

  for (const rule of sorted) {
    let newPrice = basePrice

    if (rule.ruleType === 'multiplier') {
      const p = rule.params as { factor: number }
      newPrice = Math.round(basePrice * (p.factor ?? 1))
    } else if (rule.ruleType === 'fixed_add') {
      const p = rule.params as { amount: number }
      newPrice = basePrice + (p.amount ?? 0)
    } else if (rule.ruleType === 'stock_based') {
      const p = rule.params as { tiers: { min_stock: number; discount_percent: number }[] }
      const tier = (p.tiers ?? [])
        .sort((a, b) => b.min_stock - a.min_stock)
        .find(t => stock >= t.min_stock)
      if (tier && tier.discount_percent > 0) {
        newPrice = Math.round(basePrice * (1 - tier.discount_percent / 100))
      }
    } else if (rule.ruleType === 'time_based') {
      const p = rule.params as { schedule: { days: number[]; hours?: number[]; discount_percent: number }[] }
      const day = now.getDay()
      const hour = now.getHours()
      const match = (p.schedule ?? []).find(s =>
        s.days.includes(day) && (!s.hours || s.hours.includes(hour))
      )
      if (match && match.discount_percent > 0) {
        newPrice = Math.round(basePrice * (1 - match.discount_percent / 100))
      }
    }

    // First rule that produces a price change wins — stop here
    if (newPrice !== basePrice) {
      return {
        finalPrice: Math.max(0, newPrice),
        appliedRules: [{ id: rule.id, name: rule.name, delta: newPrice - basePrice }],
      }
    }
  }

  return { finalPrice: Math.max(0, basePrice), appliedRules: [] }
}
