-- Safe re-apply of user profile fields in case 0017 was skipped on production
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "age"        integer,
  ADD COLUMN IF NOT EXISTS "gender"     varchar(10),
  ADD COLUMN IF NOT EXISTS "occupation" varchar(100);
