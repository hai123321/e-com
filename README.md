# Miu Shop

Cửa hàng bán tài khoản streaming premium (Netflix, Spotify, YouTube...) xây dựng bằng Next.js 14, TypeScript và Tailwind CSS.

**Architecture:** Frontend (Vercel) → Backend API (VPS) → PostgreSQL (VPS)

## Tech Stack

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| [Next.js](https://nextjs.org) | 14.2.5 | Framework (App Router) |
| [TypeScript](https://typescriptlang.org) | ^5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | ^3.4 | Styling |
| [Zustand](https://zustand-demo.pmnd.rs) | ^4.5 | State management (cart) |
| [Lucide React](https://lucide.dev) | ^0.400 | Icons |

### Backend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| [Fastify](https://fastify.dev) | ^5 | API framework |
| [Drizzle ORM](https://orm.drizzle.team) | ^0.36 | PostgreSQL ORM |
| [PostgreSQL](https://postgresql.org) | 16 | Database |
| [Zod](https://zod.dev) | ^3 | Validation (env + request body) |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | ^5 | Password hashing |
| [@fastify/jwt](https://github.com/fastify/fastify-jwt) | ^9 | JWT auth (7 ngày) |

### Infrastructure
| Công nghệ | Mục đích |
|---|---|
| Docker + Docker Compose | Orchestration trên VPS |
| Nginx | Reverse proxy + SSL termination |
| Let's Encrypt | SSL tự động gia hạn (12h) |
| Vercel | Frontend hosting |
| Cloudflare | DNS (grey cloud / DNS only) |

## Tính năng

- Danh sách sản phẩm tải từ backend API (fallback về `data/products.csv`)
- Giỏ hàng: thêm, xóa, cập nhật số lượng, tính tổng tiền
- Tìm kiếm realtime theo tên và mô tả sản phẩm
- Lọc sản phẩm theo tình trạng tồn kho
- Toast notification (thêm giỏ, lỗi, thành công)
- Tạo đơn hàng với row-level stock locking (tránh oversell)
- Admin API với JWT authentication
- Responsive — mobile, tablet, desktop

## Cấu trúc thư mục

```
e-com/
├── app/                            # Next.js App Router
│   ├── api/products/route.ts       # Fallback API đọc CSV
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── cart/CartSidebar.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   └── ProductGrid.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── Contact.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       └── ToastContainer.tsx
├── data/
│   └── products.csv                # Seed data + fallback
├── lib/
│   ├── store.ts
│   ├── types.ts
│   └── utils.ts
├── backend/                        # API server (deploy lên VPS)
│   ├── src/
│   │   ├── config.ts               # Zod env validation
│   │   ├── index.ts                # Fastify bootstrap
│   │   ├── db/
│   │   │   ├── schema.ts           # Drizzle table definitions
│   │   │   ├── client.ts           # pg.Pool + drizzle()
│   │   │   └── migrate.ts          # Migration runner
│   │   ├── modules/
│   │   │   ├── products/           # GET /api/v1/products
│   │   │   ├── orders/             # POST /api/v1/orders
│   │   │   └── auth/               # POST /api/v1/auth/login
│   │   └── plugins/
│   │       ├── cors.ts
│   │       ├── jwt.ts
│   │       └── error-handler.ts
│   ├── scripts/
│   │   ├── seed.ts                 # Migrations + CSV import + admin user
│   │   └── init-letsencrypt.sh    # Cấp SSL lần đầu
│   ├── nginx/conf.d/api.conf       # HTTPS + rate limit
│   ├── Dockerfile                  # Multi-stage build (~150MB)
│   ├── docker-compose.yml          # db, api, nginx, certbot
│   └── .env.example
├── next.config.mjs                 # Rewrites /api/v1/* → backend
└── .env.example
```

## Bắt đầu (Frontend only)

### Yêu cầu

- Node.js >= 18

### Chạy local

```bash
git clone https://github.com/hai123321/e-com.git
cd e-com
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Không cần backend — sản phẩm tải từ `data/products.csv` qua fallback route.

## Deploy Backend lên VPS

### Yêu cầu VPS

- Ubuntu 24.04, 4 vCore, 8GB RAM
- Docker + Docker Compose đã cài
- Domain trỏ về IP VPS (DNS A record)

### Các bước

```bash
# 1. Clone repo lên VPS
git clone https://github.com/hai123321/e-com.git
cd e-com

# 2. Tạo file .env
cp backend/.env.example backend/.env
# Sửa: DB_PASSWORD, JWT_SECRET (>= 32 ký tự), ADMIN_PASSWORD, SSL_EMAIL

# 3. Cấp SSL lần đầu (yêu cầu domain đã trỏ về VPS)
bash backend/scripts/init-letsencrypt.sh

# 4. Khởi động services
docker compose -f backend/docker-compose.yml up -d

# 5. Seed database (migrations + products + admin)
docker compose -f backend/docker-compose.yml exec api \
  npx tsx scripts/seed.ts
```

### Kiểm tra

```bash
curl https://api.miushop.io.vn/api/v1/health
# → { "status": "ok" }
```

### Biến môi trường backend (`backend/.env`)

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DB_USER` | ✓ | PostgreSQL user |
| `DB_PASSWORD` | ✓ | PostgreSQL password |
| `DATABASE_URL` | ✓ | `postgresql://user:pass@db:5432/miushop` |
| `JWT_SECRET` | ✓ | Tối thiểu 32 ký tự |
| `ADMIN_PASSWORD` | ✓ | Mật khẩu tài khoản admin |
| `SSL_EMAIL` | ✓ | Email Let's Encrypt |
| `CORS_ORIGIN` | | Mặc định: `http://localhost:3000` |
| `PORT` | | Mặc định: `3001` |

## Deploy Frontend lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → **Add New Project** → chọn repo
3. Thêm environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://api.miushop.io.vn/api/v1
   ```
4. Deploy

## Cấu hình DNS (Cloudflare)

| Record | Name | Value |
|---|---|---|
| A | `@` | Vercel IP (lấy từ Vercel Dashboard) |
| CNAME | `www` | `cname.vercel-dns.com` |
| A | `api` | IP VPS |

> Tất cả records dùng **grey cloud (DNS only)** để tránh conflict với Vercel edge network và SSL.

## API Endpoints

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1/health` | | Health check |
| GET | `/api/v1/products` | | Danh sách sản phẩm (search, pagination) |
| GET | `/api/v1/products/:id` | | Chi tiết sản phẩm |
| POST | `/api/v1/orders` | | Tạo đơn hàng |
| POST | `/api/v1/auth/login` | | Đăng nhập admin → JWT |
| GET | `/api/v1/admin/orders` | JWT | Danh sách đơn hàng |
| GET | `/api/v1/admin/stats` | JWT | Dashboard stats |

## Quản lý sản phẩm

### Qua CSV (frontend fallback)

Chỉnh sửa `data/products.csv` — không cần thay đổi code.

```csv
id,name,description,price,image,stock
1,Netflix Premium,Tài khoản Netflix Premium 4K,250000,https://example.com/img.jpg,15
```

### Qua Admin API (khi backend chạy)

```bash
# Đăng nhập
curl -X POST https://api.miushop.io.vn/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### Quy tắc tồn kho

| Số lượng | Trạng thái | Màu badge |
|---|---|---|
| > 10 | Còn hàng | Xanh lá |
| 6 – 10 | Còn ít | Vàng |
| 1 – 5 | Sắp hết | Đỏ |
| 0 | Hết hàng | Xám |

## Scripts

```bash
# Frontend
npm run dev      # Development server (localhost:3000)
npm run build    # Build production
npm run start    # Chạy production build
npm run lint     # Kiểm tra ESLint

# Backend (chạy trong thư mục backend/)
npm run dev      # Development với tsx watch
npm run build    # Compile TypeScript
npm run start    # Chạy production build
npm run migrate  # Chạy database migrations
npm run seed     # Seed database
```

## Giấy phép

MIT
