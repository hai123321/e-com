# Miu Shop

Cửa hàng bán tài khoản phần mềm và dịch vụ số (AI, Streaming, Học tập...) xây dựng bằng Next.js 14, TypeScript và Tailwind CSS.

**Architecture:** Frontend (VPS) + Backend API (VPS) + PostgreSQL (VPS) — toàn bộ chạy trên Docker Compose.

## Tech Stack

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| [Next.js](https://nextjs.org) | 14.2.5 | Framework (App Router, standalone output) |
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
| Docker + Docker Compose | Orchestration toàn bộ stack trên VPS |
| Nginx | Reverse proxy + SSL termination |
| Let's Encrypt | SSL tự động gia hạn (12h) |
| GitHub Actions + self-hosted runner | CI/CD tự động deploy khi push lên main |
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
├── nginx/
│   ├── nginx.conf                  # Worker / logging config
│   └── conf.d/
│       ├── frontend.conf           # HTTPS miushop.io.vn → frontend:3000
│       └── api.conf                # HTTPS api.miushop.io.vn → api:3001
├── backend/                        # Fastify API server
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
│   ├── Dockerfile                  # Multi-stage build (~150MB)
│   └── drizzle/                    # Migration files
├── Dockerfile                      # Multi-stage build Next.js (standalone)
├── docker-compose.yml              # Full stack: frontend, api, db, nginx, certbot
├── next.config.mjs                 # standalone output + rewrite /api/v1/* → api
└── .env.example
```

## Bắt đầu (Local)

### Yêu cầu

- Node.js >= 18

### Chạy frontend only

```bash
git clone https://github.com/hai123321/e-com.git
cd e-com
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Không cần backend — sản phẩm tải từ `data/products.csv` qua fallback route.

### Chạy full stack local

```bash
cp .env.example .env
# Sửa .env: DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD

docker compose up -d --build

# Seed database lần đầu
docker compose exec api npx tsx scripts/seed.ts
```

## Deploy lên VPS

### Yêu cầu VPS

- Ubuntu 24.04, 2+ vCore, 4GB+ RAM
- Docker + Docker Compose đã cài
- Domain trỏ về IP VPS (DNS A record cho cả `miushop.io.vn` và `api.miushop.io.vn`)
- GitHub Actions self-hosted runner đã cài và chạy với label `miu-server-e-com`

### Lần đầu deploy (manual)

```bash
# 1. Clone repo lên VPS
git clone https://github.com/hai123321/e-com.git
cd e-com

# 2. Tạo file .env
cp .env.example .env
# Sửa: DB_USER, DB_PASSWORD, JWT_SECRET (>= 32 ký tự), ADMIN_PASSWORD

# 3. Cấp SSL cho cả 2 domain
bash backend/scripts/init-letsencrypt.sh

# 4. Khởi động toàn bộ stack
docker compose up -d --build

# 5. Seed database (migrations + products + admin)
docker compose exec api npx tsx scripts/seed.ts
```

### CI/CD (sau khi merge vào main)

Push lên `main` → GitHub Actions tự động:
1. Build lại frontend và backend
2. Khởi động lại các container
3. Dọn dẹp image cũ

### Biến môi trường (`.env`)

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DB_USER` | ✓ | PostgreSQL user |
| `DB_PASSWORD` | ✓ | PostgreSQL password |
| `JWT_SECRET` | ✓ | Tối thiểu 32 ký tự |
| `ADMIN_PASSWORD` | ✓ | Mật khẩu tài khoản admin |
| `CORS_ORIGIN` | | Mặc định: `https://miushop.io.vn` |
| `NEXT_PUBLIC_API_URL` | | Mặc định: `https://miushop.io.vn` |
| `API_INTERNAL_URL` | | Mặc định: `http://api:3001` (Docker internal) |

### GitHub Secrets cần cấu hình

Vào **Settings → Secrets → Actions** của repo, thêm:

```
DB_USER
DB_PASSWORD
JWT_SECRET
ADMIN_PASSWORD
CORS_ORIGIN
NEXT_PUBLIC_API_URL
```

## Cấu hình DNS (Cloudflare)

| Record | Name | Value |
|---|---|---|
| A | `@` | IP VPS |
| A | `www` | IP VPS |
| A | `api` | IP VPS |

> Tất cả records dùng **grey cloud (DNS only)** để SSL Let's Encrypt hoạt động đúng.

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

### Qua CSV

Chỉnh sửa `data/products.csv` — không cần thay đổi code.

```csv
name,description,price,image,stock,category
Netflix Extra Slot 1 tháng,Tài khoản 1 slot riêng tư,60000,,20,Streaming
```

### Qua Admin API

```bash
# Đăng nhập
TOKEN=$(curl -s -X POST https://api.miushop.io.vn/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}' | jq -r .data.token)

# Xem đơn hàng
curl https://api.miushop.io.vn/api/v1/admin/orders \
  -H "Authorization: Bearer $TOKEN"
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
