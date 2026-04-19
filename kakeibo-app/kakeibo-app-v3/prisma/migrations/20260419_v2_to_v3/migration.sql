-- v2 → v3 スキーマ移行マイグレーション
-- 前提: v2 DB (payments: 78, credit_cards: 20, salaries: 8, categories: 65) に対する追加的マイグレーション
-- category_id の NULL 件数は 0 件なので NOT NULL 化は安全

BEGIN;

-- =======================================
-- 1. accounts テーブル新規作成
-- =======================================
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "balance_updated_at" TIMESTAMP(3) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accounts_user_id_sort_order_idx" ON "accounts"("user_id", "sort_order");

-- =======================================
-- 2. credit_card_statements テーブル新規作成
-- =======================================
CREATE TABLE "credit_card_statements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credit_card_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "confirmed_amount" INTEGER NOT NULL,
    "withdrawn_amount" INTEGER,
    "withdrawn_at" TIMESTAMP(3),
    "account_id" TEXT,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "credit_card_statements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "credit_card_statements_user_id_credit_card_id_month_key"
  ON "credit_card_statements"("user_id", "credit_card_id", "month");

-- =======================================
-- 3. balance_histories テーブル新規作成
-- =======================================
CREATE TABLE "balance_histories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    CONSTRAINT "balance_histories_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "balance_histories_user_id_account_id_recorded_at_idx"
  ON "balance_histories"("user_id", "account_id", "recorded_at");

-- =======================================
-- 4. credit_cards: account_id 追加
-- =======================================
ALTER TABLE "credit_cards" ADD COLUMN "account_id" TEXT;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =======================================
-- 5. payments: usage_date 追加 + バックフィル (month-01)
-- =======================================
ALTER TABLE "payments" ADD COLUMN "usage_date" DATE;
UPDATE "payments" SET "usage_date" = (month || '-01')::DATE;
ALTER TABLE "payments" ALTER COLUMN "usage_date" SET NOT NULL;

-- =======================================
-- 6. payments: account_id 追加
-- =======================================
ALTER TABLE "payments" ADD COLUMN "account_id" TEXT;
ALTER TABLE "payments" ADD CONSTRAINT "payments_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =======================================
-- 7. payments: credit_card_id を nullable 化 + FK を SetNull に変更
-- =======================================
ALTER TABLE "payments" ALTER COLUMN "credit_card_id" DROP NOT NULL;
ALTER TABLE "payments" DROP CONSTRAINT "payments_credit_card_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_credit_card_id_fkey"
  FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =======================================
-- 8. payments: category_id を NOT NULL 化 + FK を Restrict に変更
-- =======================================
ALTER TABLE "payments" ALTER COLUMN "category_id" SET NOT NULL;
ALTER TABLE "payments" DROP CONSTRAINT "payments_category_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- =======================================
-- 9. payments: インデックス差分
-- =======================================
DROP INDEX IF EXISTS "payments_user_id_credit_card_id_idx";
DROP INDEX IF EXISTS "payments_recurring_group_id_idx";

CREATE INDEX "payments_user_id_usage_date_idx" ON "payments"("user_id", "usage_date");
CREATE INDEX "payments_user_id_credit_card_id_month_idx"
  ON "payments"("user_id", "credit_card_id", "month");
CREATE INDEX "payments_user_id_recurring_group_id_idx"
  ON "payments"("user_id", "recurring_group_id");

-- =======================================
-- 10. credit_card_statements FK
-- =======================================
ALTER TABLE "credit_card_statements" ADD CONSTRAINT "credit_card_statements_credit_card_id_fkey"
  FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_card_statements" ADD CONSTRAINT "credit_card_statements_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =======================================
-- 11. balance_histories FK
-- =======================================
ALTER TABLE "balance_histories" ADD CONSTRAINT "balance_histories_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
