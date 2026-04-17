ALTER TABLE "products" ADD COLUMN "sale_price" integer;
ALTER TABLE "products" ADD COLUMN "sale_ends_at" timestamp with time zone;
ALTER TABLE "products" ADD COLUMN "sold_count" integer NOT NULL DEFAULT 0;
