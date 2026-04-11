import * as repo from './orders.repository.js'
import type { CreateOrderInput, OrderQuery, UpdateStatusInput } from './orders.schema.js'

export async function createOrder(input: CreateOrderInput) {
  return repo.createOrder(input)
}

export async function listOrders(query: OrderQuery) {
  const { rows, total, page, limit } = await repo.findOrders(query)
  return {
    data: rows,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  }
}

export async function getOrder(id: number) {
  const order = await repo.findOrderById(id)
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
  return order
}

export async function updateOrderStatus(id: number, input: UpdateStatusInput) {
  const order = await repo.updateOrderStatus(id, input.status)
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 })
  return order
}

export async function getDashboardStats() {
  return repo.getDashboardStats()
}
