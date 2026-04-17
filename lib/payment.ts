// ── Bank Transfer Config ────────────────────────────────────────────────────
// Thay đổi thông tin ngân hàng tại đây
export const BANK = {
  id: 'MB',                // MB Bank — xem danh sách tại vietqr.io/danh-sach-ngan-hang
  account: '0383574189',   // Số tài khoản hoặc số điện thoại MBBank
  name: 'TRIEU HAI',       // Tên chủ tài khoản (UPPERCASE)
}

/**
 * Tạo URL ảnh QR chuyển khoản theo chuẩn VietQR
 * @param amount   Số tiền (0 = để người dùng tự nhập)
 * @param addInfo  Nội dung chuyển khoản
 */
export function vietQrUrl(amount: number, addInfo: string): string {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: BANK.name,
  })
  return `https://img.vietqr.io/image/${BANK.id}-${BANK.account}-compact2.jpg?${params.toString()}`
}
