import { Resend } from 'resend'
import { config } from '../config.js'

let resend: Resend | null = null

function getResend(): Resend | null {
  if (!config.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(config.RESEND_API_KEY)
  return resend
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

interface OrderItem {
  productName: string
  productPrice: number
  quantity: number
}

interface OrderConfirmationParams {
  to: string
  customerName: string
  orderId: number
  items: OrderItem[]
  total: number
}

function buildOrderConfirmationHtml(params: OrderConfirmationParams): string {
  const { customerName, orderId, items, total } = params

  const itemRows = items.map((item) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${item.productName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">${formatCurrency(item.productPrice * item.quantity)}</td>
    </tr>`
  ).join('')

  return `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Xác nhận đơn hàng #${orderId}</title></head>
<body style="font-family:Arial,sans-serif;background:#f8f9fa;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">MiuShop</h1>
      <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Đơn hàng đã được xác nhận</p>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:16px">Xin chào <strong>${customerName}</strong>,</p>
      <p style="color:#374151">Đơn hàng <strong>#${orderId}</strong> của bạn đã được xác nhận và đang được xử lý.</p>

      <h2 style="font-size:16px;color:#111827;margin:24px 0 12px">Chi tiết đơn hàng</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:600">Sản phẩm</th>
            <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:600">SL</th>
            <th style="padding:10px 12px;text-align:right;color:#6b7280;font-weight:600">Thành tiền</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;font-weight:700;text-align:right;color:#111827">Tổng cộng:</td>
            <td style="padding:12px;font-weight:700;text-align:right;color:#4f46e5;font-size:16px">${formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:24px;padding:20px;background:#f0fdf4;border-radius:8px;border-left:4px solid #22c55e">
        <h3 style="margin:0 0 8px;font-size:14px;color:#166534">Hướng dẫn nhận hàng</h3>
        <ul style="margin:0;padding-left:20px;color:#166534;font-size:14px;line-height:1.8">
          <li>Tài khoản/mã kích hoạt sẽ được gửi qua Zalo sau khi thanh toán được xác nhận.</li>
          <li>Vui lòng kiểm tra tin nhắn Zalo từ MiuShop trong vòng 15 phút.</li>
          <li>Nếu chưa nhận được, liên hệ hỗ trợ qua Zalo: <strong>0123 456 789</strong>.</li>
        </ul>
      </div>

      <p style="margin-top:24px;color:#6b7280;font-size:13px">Cảm ơn bạn đã mua hàng tại MiuShop!</p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
      &copy; 2025 MiuShop &mdash; miushop.io.vn
    </div>
  </div>
</body>
</html>`
}

export async function sendOrderConfirmationEmail(params: OrderConfirmationParams): Promise<void> {
  const client = getResend()
  if (!client) return

  await client.emails.send({
    from: config.RESEND_FROM,
    to: params.to,
    subject: `MiuShop - Xác nhận đơn hàng #${params.orderId}`,
    html: buildOrderConfirmationHtml(params),
  })
}
