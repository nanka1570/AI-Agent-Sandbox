-- v1 → v2 DB マイグレーション
-- PascalCase/camelCase テーブル・カラムを snake_case に変換
-- ※ Supabase SQL Editor で手動実行する

-- ============================================================
-- 1. FK 制約を削除
-- ============================================================
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_creditCardId_fkey";
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_categoryId_fkey";
ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS "Budget_categoryId_fkey";

-- ============================================================
-- 2. 旧インデックスを削除
-- ============================================================
DROP INDEX IF EXISTS "Salary_userId_idx";
DROP INDEX IF EXISTS "CreditCard_userId_idx";
DROP INDEX IF EXISTS "Payment_userId_idx";
DROP INDEX IF EXISTS "Category_userId_idx";
DROP INDEX IF EXISTS "Budget_userId_idx";
DROP INDEX IF EXISTS "Budget_userId_categoryId_month_key";

-- ============================================================
-- 3. Budget テーブルをアーカイブとしてリネーム（データ保護）
-- ============================================================
ALTER TABLE "Budget" RENAME TO "_budget_v1_archive";

-- ============================================================
-- 4. テーブルリネーム（PascalCase → snake_case）
-- ============================================================
ALTER TABLE "Salary" RENAME TO "salaries";
ALTER TABLE "CreditCard" RENAME TO "credit_cards";
ALTER TABLE "Payment" RENAME TO "payments";
ALTER TABLE "Category" RENAME TO "categories";

-- ============================================================
-- 5. salaries カラムリネーム
-- ============================================================
ALTER TABLE "salaries" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "salaries" RENAME COLUMN "payDay" TO "pay_day";
ALTER TABLE "salaries" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "salaries" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "salaries" RENAME COLUMN "updatedAt" TO "updated_at";

-- ============================================================
-- 6. credit_cards カラムリネーム
-- ============================================================
ALTER TABLE "credit_cards" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "credit_cards" RENAME COLUMN "closingDay" TO "closing_day";
ALTER TABLE "credit_cards" RENAME COLUMN "paymentDay" TO "payment_day";
ALTER TABLE "credit_cards" RENAME COLUMN "paymentMonthOffset" TO "payment_month_offset";
ALTER TABLE "credit_cards" RENAME COLUMN "confirmationDay" TO "confirmation_day";
ALTER TABLE "credit_cards" RENAME COLUMN "confirmationMonthOffset" TO "confirmation_month_offset";
ALTER TABLE "credit_cards" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "credit_cards" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "credit_cards" RENAME COLUMN "updatedAt" TO "updated_at";

-- ============================================================
-- 7. payments カラムリネーム
-- ============================================================
ALTER TABLE "payments" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "payments" RENAME COLUMN "creditCardId" TO "credit_card_id";
ALTER TABLE "payments" RENAME COLUMN "categoryId" TO "category_id";
ALTER TABLE "payments" RENAME COLUMN "isRecurring" TO "is_recurring";
ALTER TABLE "payments" RENAME COLUMN "recurringGroupId" TO "recurring_group_id";
ALTER TABLE "payments" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "payments" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "payments" RENAME COLUMN "updatedAt" TO "updated_at";

-- ============================================================
-- 8. categories カラムリネーム
-- ============================================================
ALTER TABLE "categories" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "categories" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "categories" RENAME COLUMN "isDefault" TO "is_default";
ALTER TABLE "categories" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "categories" RENAME COLUMN "updatedAt" TO "updated_at";

-- ============================================================
-- 9. 新複合インデックス作成（v2 スキーマ準拠）
-- ============================================================
CREATE INDEX "salaries_user_id_month_idx" ON "salaries"("user_id", "month");
CREATE INDEX "credit_cards_user_id_sort_order_idx" ON "credit_cards"("user_id", "sort_order");
CREATE INDEX "payments_user_id_month_idx" ON "payments"("user_id", "month");
CREATE INDEX "payments_user_id_credit_card_id_idx" ON "payments"("user_id", "credit_card_id");
CREATE INDEX "payments_recurring_group_id_idx" ON "payments"("recurring_group_id");
CREATE INDEX "categories_user_id_sort_order_idx" ON "categories"("user_id", "sort_order");

-- ============================================================
-- 10. FK 制約を新名前で再作成
-- ============================================================
ALTER TABLE "payments" ADD CONSTRAINT "payments_credit_card_id_fkey"
  FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 11. _prisma_migrations テーブルをクリア（v1 履歴をリセット）
-- ============================================================
DELETE FROM "_prisma_migrations";
