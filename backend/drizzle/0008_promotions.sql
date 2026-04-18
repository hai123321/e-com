CREATE TABLE "promotions" (
  "id"              SERIAL PRIMARY KEY,
  "code"            VARCHAR(50) NOT NULL UNIQUE,
  "discount_type"   VARCHAR(10) NOT NULL,
  "discount_value"  INTEGER NOT NULL,
  "min_order_value" INTEGER,
  "max_uses"        INTEGER,
  "used_count"      INTEGER NOT NULL DEFAULT 0,
  "is_active"       BOOLEAN NOT NULL DEFAULT TRUE,
  "expires_at"      TIMESTAMPTZ,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "valid_discount_type" CHECK ("discount_type" IN ('percent','fixed')),
  CONSTRAINT "valid_percent" CHECK (
    "discount_type" != 'percent' OR ("discount_value" >= 0 AND "discount_value" <= 100)
  )
);
