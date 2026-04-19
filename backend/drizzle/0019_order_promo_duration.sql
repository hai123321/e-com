-- Add duration_months to products (1/3/6/12 months subscription length)
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "duration_months" integer NOT NULL DEFAULT 1;

-- Link orders to users (nullable — guest orders have no user)
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "user_id"    integer REFERENCES "users"("id"),
  ADD COLUMN IF NOT EXISTS "promo_code" varchar(50);
