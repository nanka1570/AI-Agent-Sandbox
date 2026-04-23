-- 定期支払 (Subscription) モデル追加

BEGIN;

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "credit_card_id" TEXT,
    "account_id" TEXT,
    "category_id" TEXT NOT NULL,
    "day_of_month" INTEGER NOT NULL,
    "start_month" TEXT NOT NULL,
    "end_month" TEXT,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");
CREATE INDEX "subscriptions_user_id_start_month_idx" ON "subscriptions"("user_id", "start_month");

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_credit_card_id_fkey"
  FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON UPDATE CASCADE;

-- RLS
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_owner" ON "subscriptions"
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

COMMIT;
