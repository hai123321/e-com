CREATE TABLE IF NOT EXISTS "user_notifications" (
  "id"         serial PRIMARY KEY,
  "user_id"    integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type"       varchar(50)  NOT NULL DEFAULT 'order_delivered',
  "title"      varchar(255) NOT NULL,
  "body"       text         NOT NULL DEFAULT '',
  "is_read"    boolean      NOT NULL DEFAULT false,
  "meta"       jsonb                 DEFAULT '{}',
  "created_at" timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_user_notifications_user_id"
  ON "user_notifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_notifications_is_read"
  ON "user_notifications"("user_id", "is_read");
