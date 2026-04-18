-- Add referral fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" varchar(20) UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by_id" integer;

-- Create referrals table
CREATE TABLE IF NOT EXISTS "referrals" (
  "id" serial PRIMARY KEY NOT NULL,
  "referrer_id" integer NOT NULL REFERENCES "users"("id"),
  "referred_id" integer NOT NULL REFERENCES "users"("id"),
  "credit_amount" integer NOT NULL DEFAULT 20000,
  "credited_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "referrals_referred_id_unique" UNIQUE("referred_id")
);

-- Create user_credits table
CREATE TABLE IF NOT EXISTS "user_credits" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "amount" integer NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "referral_id" integer REFERENCES "referrals"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
