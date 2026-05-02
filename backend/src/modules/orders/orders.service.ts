import * as repo from './orders.repository.js'
import { sendOrderConfirmationEmail } from '../../shared/email.js'
import { createNotification } from '../notifications/notifications.repository.js'
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

  if (input.status === 'confirmed' && order.customerEmail) {
    const full = await repo.findOrderById(id)
    if (full) {
      sendOrderConfirmationEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        orderId: order.id,
        items: full.items,
        total: order.total,
      }).catch(() => { /* non-critical — log in production */ })
    }
  }

  if (input.status === 'delivered' && order.userId) {
    const parts: string[] = [`Đơn hàng của bạn trị giá ${order.total.toLocaleString('vi-VN')}₫ đã được xử lý thành công!`]
    if (input.accountInfo)  parts.push(`📋 Thông tin tài khoản:\n${input.accountInfo}`)
    if (input.instructions) parts.push(`📖 Hướng dẫn sử dụng:\n${input.instructions}`)

    createNotification({
      userId: order.userId,
      type: 'order_delivered',
      title: `Đơn hàng #${order.id} đã hoàn thành`,
      body: parts.join('\n\n'),
      meta: {
        orderId: order.id,
        accountInfo: input.accountInfo ?? null,
        instructions: input.instructions ?? null,
      },
    }).catch(() => { /* non-critical */ })
  }

  return order
}

export async function getDashboardStats() {
  return repo.getDashboardStats()
}

export async function getAnalytics(days: number) {
  return repo.getAnalytics(days)
}
