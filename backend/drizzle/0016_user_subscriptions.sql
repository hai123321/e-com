CREATE TABLE user_subscriptions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  service_name    VARCHAR(255) NOT NULL,
  logo_url        VARCHAR(512),
  monthly_price   INTEGER NOT NULL,
  billing_cycle   VARCHAR(10) NOT NULL DEFAULT 'monthly',
  expires_at      TIMESTAMP WITH TIME ZONE,
  source          VARCHAR(20) NOT NULL DEFAULT 'manual',
  miushop_order_id   INTEGER REFERENCES orders(id),
  miushop_product_id INTEGER REFERENCES products(id),
  miu_suggested_product_id INTEGER REFERENCES products(id),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
