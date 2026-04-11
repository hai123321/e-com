# Miu Shop

Cửa hàng bán tài khoản streaming premium (Netflix, Spotify, YouTube...) xây dựng bằng Next.js 14, TypeScript và Tailwind CSS. Sẵn sàng deploy lên Vercel.

## Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| [Next.js](https://nextjs.org) | 14.2.5 | Framework (App Router) |
| [TypeScript](https://typescriptlang.org) | ^5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | ^3.4 | Styling |
| [Zustand](https://zustand-demo.pmnd.rs) | ^4.5 | State management (cart) |
| [Lucide React](https://lucide.dev) | ^0.400 | Icons |

## Tính năng

- Danh sách sản phẩm tải từ `data/products.csv` qua API route
- Giỏ hàng: thêm, xóa, cập nhật số lượng, tính tổng tiền
- Tìm kiếm realtime theo tên và mô tả sản phẩm
- Lọc sản phẩm theo tình trạng tồn kho
- Toast notification (thêm giỏ, lỗi, thành công)
- Responsive — mobile, tablet, desktop
- SEO metadata tích hợp sẵn
- Deploy Vercel zero-config

## Cấu trúc thư mục

```
miu-shop/
├── app/
│   ├── api/products/route.ts   # Server API đọc CSV
│   ├── globals.css             # Tailwind + custom tokens
│   ├── layout.tsx              # Root layout, font, metadata
│   └── page.tsx                # Entry point
├── components/
│   ├── cart/
│   │   └── CartSidebar.tsx     # Giỏ hàng slide-in
│   ├── layout/
│   │   ├── Navbar.tsx          # Sticky header + cart badge
│   │   └── Footer.tsx          # Footer 4 cột
│   ├── product/
│   │   ├── ProductCard.tsx     # Card sản phẩm
│   │   └── ProductGrid.tsx     # Grid + search + filter
│   ├── sections/
│   │   ├── Hero.tsx            # Banner chính
│   │   ├── Features.tsx        # 4 tính năng nổi bật
│   │   └── Contact.tsx         # Form liên hệ
│   └── ui/
│       ├── Badge.tsx           # Stock badge
│       ├── Button.tsx          # Button variants
│       └── ToastContainer.tsx  # Toast notifications
├── data/
│   └── products.csv            # Dữ liệu sản phẩm
├── lib/
│   ├── store.ts                # Zustand store (cart, filter, toast)
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # formatCurrency, filterProducts, cn()
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Bắt đầu

### Yêu cầu

- Node.js >= 18
- npm / yarn / pnpm

### Cài đặt và chạy local

```bash
# Clone repo
git clone https://github.com/hai123321/e-com.git
cd e-com

# Cài dependencies
npm install

# Chạy development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

### Build production

```bash
npm run build
npm run start
```

## Quản lý sản phẩm

Sản phẩm được lưu trong file `data/products.csv`. Chỉnh sửa file này để thêm, sửa, xóa sản phẩm — không cần thay đổi code.

### Định dạng CSV

```csv
id,name,description,price,image,stock
1,Netflix Premium,Tài khoản Netflix Premium 4K,250000,https://example.com/img.jpg,15
```

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | string | ID duy nhất |
| `name` | string | Tên sản phẩm |
| `description` | string | Mô tả ngắn |
| `price` | number | Giá (VND) |
| `image` | string | URL ảnh |
| `stock` | number | Số lượng tồn kho |

### Quy tắc tồn kho

| Số lượng | Trạng thái | Màu badge |
|---|---|---|
| > 10 | Còn hàng | Xanh lá |
| 6 – 10 | Còn ít | Vàng |
| 1 – 5 | Sắp hết | Đỏ |
| 0 | Hết hàng | Xám |

## Deploy lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → **Add New Project** → chọn repo
3. Vercel tự nhận diện Next.js → nhấn **Deploy**

Không cần cấu hình thêm. Vercel sẽ chạy `npm run build` và serve tự động.

> **Lưu ý:** File `data/products.csv` được đọc ở runtime phía server. Nếu muốn chỉnh sản phẩm sau khi deploy, cần redeploy hoặc chuyển sang database (Supabase, PlanetScale...).

## Biến môi trường

Hiện tại project không yêu cầu biến môi trường. Nếu mở rộng tích hợp thanh toán hoặc database, tạo file `.env.local`:

```env
# Ví dụ nếu thêm database
DATABASE_URL=your_database_url

# Ví dụ nếu thêm cổng thanh toán
PAYMENT_API_KEY=your_key
```

## Scripts

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Build production
npm run start    # Chạy production build
npm run lint     # Kiểm tra ESLint
```

## Giấy phép

MIT
