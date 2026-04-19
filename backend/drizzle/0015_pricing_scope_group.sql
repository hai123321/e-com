-- Add 'group' to the valid_scope_type CHECK constraint on pricing_rules
ALTER TABLE "pricing_rules"
  DROP CONSTRAINT IF EXISTS "valid_scope_type";

ALTER TABLE "pricing_rules"
  ADD CONSTRAINT "valid_scope_type" CHECK (
    "scope_type" IN ('global', 'category', 'product', 'group')
  );
