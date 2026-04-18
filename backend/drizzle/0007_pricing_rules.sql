CREATE TABLE "pricing_rules" (
  "id"          SERIAL PRIMARY KEY,
  "name"        VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "rule_type"   VARCHAR(50) NOT NULL,
  "params"      JSONB NOT NULL DEFAULT '{}',
  "scope_type"  VARCHAR(20) NOT NULL DEFAULT 'global',
  "scope_value" VARCHAR(255),
  "priority"    INTEGER NOT NULL DEFAULT 0,
  "is_active"   BOOLEAN NOT NULL DEFAULT TRUE,
  "starts_at"   TIMESTAMPTZ,
  "ends_at"     TIMESTAMPTZ,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "valid_rule_type" CHECK (
    "rule_type" IN ('multiplier','fixed_add','stock_based','time_based','manual_override')
  ),
  CONSTRAINT "valid_scope_type" CHECK (
    "scope_type" IN ('global','category','product')
  )
);
CREATE INDEX "idx_pricing_rules_scope"  ON "pricing_rules"("scope_type", "scope_value");
CREATE INDEX "idx_pricing_rules_active" ON "pricing_rules"("is_active");
