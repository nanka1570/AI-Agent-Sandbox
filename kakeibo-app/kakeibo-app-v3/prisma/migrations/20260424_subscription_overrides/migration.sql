-- 定期支払の月別オーバーライド（金額変更 / スキップ）

BEGIN;

CREATE TABLE "subscription_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" INTEGER,
    "skip" BOOLEAN NOT NULL DEFAULT false,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscription_overrides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_overrides_subscription_id_month_key"
  ON "subscription_overrides"("subscription_id", "month");
CREATE INDEX "subscription_overrides_user_id_month_idx"
  ON "subscription_overrides"("user_id", "month");

ALTER TABLE "subscription_overrides"
  ADD CONSTRAINT "subscription_overrides_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_overrides" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_overrides_owner" ON "subscription_overrides"
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

COMMIT;
