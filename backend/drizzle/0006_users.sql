CREATE TABLE "users" (
  "id"            SERIAL PRIMARY KEY,
  "email"         VARCHAR(255) NOT NULL UNIQUE,
  "name"          VARCHAR(255) NOT NULL DEFAULT '',
  "avatar"        VARCHAR(512),
  "password_hash" VARCHAR(255),
  "google_id"     VARCHAR(255) UNIQUE,
  "is_active"     BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "idx_users_email"     ON "users"("email");
CREATE INDEX "idx_users_google_id" ON "users"("google_id");
