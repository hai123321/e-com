import {
  getSubscriptionsByUser,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  subscriptionExistsByOrderId,
  getOrderItemsForUserByEmail,
  findProductByFuzzyName,
} from './subscriptions.repository.js'
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from './subscriptions.schema.js'

const STREAMING_CATEGORIES = ['Streaming', 'Software', 'subscription', 'Subscriptions']

export async function listSubscriptions(userId: number) {
  return getSubscriptionsByUser(userId)
}

export async function addSubscription(userId: number, input: CreateSubscriptionInput) {
  const suggestedProduct = await findProductByFuzzyName(input.serviceName)

  let miuSuggestedProductId: number | undefined
  let savingsPercent: number | undefined

  if (suggestedProduct) {
    miuSuggestedProductId = suggestedProduct.id
    const effectivePrice = suggestedProduct.salePrice ?? suggestedProduct.price
    if (input.monthlyPrice > 0 && effectivePrice < input.monthlyPrice) {
      savingsPercent = Math.round((1 - effectivePrice / input.monthlyPrice) * 100)
    }
  }

  const sub = await createSubscription({
    userId,
    serviceName:           input.serviceName,
    logoUrl:               input.logoUrl,
    monthlyPrice:          input.monthlyPrice,
    billingCycle:          input.billingCycle ?? 'monthly',
    expiresAt:             input.expiresAt ? new Date(input.expiresAt) : undefined,
    source:                'manual',
    miuSuggestedProductId: miuSuggestedProductId ?? null,
  })

  return { ...sub, savingsPercent: savingsPercent ?? null }
}

export async function editSubscription(
  id: number,
  userId: number,
  input: UpdateSubscriptionInput,
) {
  const existing = await getSubscriptionById(id, userId)
  if (!existing) throw new Error('Subscription not found')

  return updateSubscription(id, userId, {
    ...(input.serviceName  !== undefined && { serviceName:  input.serviceName }),
    ...(input.logoUrl      !== undefined && { logoUrl:      input.logoUrl }),
    ...(input.monthlyPrice !== undefined && { monthlyPrice: input.monthlyPrice }),
    ...(input.billingCycle !== undefined && { billingCycle: input.billingCycle }),
    ...(input.expiresAt    !== undefined && { expiresAt:    input.expiresAt ? new Date(input.expiresAt) : null }),
    ...(input.isActive     !== undefined && { isActive:     input.isActive }),
  })
}

export async function removeSubscription(id: number, userId: number) {
  const deleted = await deleteSubscription(id, userId)
  if (!deleted) throw new Error('Subscription not found')
}

export async function importFromOrders(userId: number, userEmail: string) {
  const orderItems = await getOrderItemsForUserByEmail(userEmail)

  const streamingItems = orderItems.filter((item) =>
    STREAMING_CATEGORIES.some((cat) =>
      item.category.toLowerCase().includes(cat.toLowerCase())
    )
  )

  let imported = 0
  let skipped  = 0

  for (const item of streamingItems) {
    const alreadyExists = await subscriptionExistsByOrderId(item.orderId)
    if (alreadyExists) {
      skipped++
      continue
    }

    await createSubscription({
      userId,
      serviceName:      item.productName,
      logoUrl:          item.image || null,
      monthlyPrice:     item.productPrice,
      billingCycle:     'monthly',
      source:           'miushop',
      miushopOrderId:   item.orderId,
      miushopProductId: item.productId,
    })
    imported++
  }

  return { imported, skipped }
}

export async function getSubscriptionSummary(userId: number) {
  const subs = await getSubscriptionsByUser(userId)
  const active = subs.filter((s) => s.isActive)

  let totalMonthly = 0
  for (const sub of active) {
    if (sub.billingCycle === 'yearly') {
      totalMonthly += Math.round(sub.monthlyPrice / 12)
    } else {
      totalMonthly += sub.monthlyPrice
    }
  }

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringSoon = active.filter(
    (s) => s.expiresAt && s.expiresAt > now && s.expiresAt <= thirtyDaysFromNow,
  )

  return {
    totalMonthly,
    totalYearly:  totalMonthly * 12,
    count:        active.length,
    expiringSoon,
  }
}
