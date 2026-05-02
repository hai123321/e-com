-- Add wallet balance to users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "wallet_balance" integer NOT NULL DEFAULT 0;

-- Payment transactions table
CREATE TYPE payment_type   AS ENUM ('order', 'topup');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');

CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id"              serial PRIMARY KEY,
  "order_id"        integer REFERENCES "orders"("id") ON DELETE SET NULL,
  "user_id"         integer REFERENCES "users"("id")  ON DELETE SET NULL,
  "type"            payment_type   NOT NULL DEFAULT 'order',
  "amount"          integer        NOT NULL,
  "status"          payment_status NOT NULL DEFAULT 'pending',
  "sepay_tx_id"     varchar(255),
  "sepay_order_id"  varchar(255),
  "ipn_payload"     jsonb,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_payment_transactions_order_id"
  ON "payment_transactions"("order_id");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_user_id"
  ON "payment_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_sepay_tx_id"
  ON "payment_transactions"("sepay_tx_id");
