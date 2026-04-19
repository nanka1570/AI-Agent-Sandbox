-- kakeibo-app v3 RLS ポリシー
-- 全テーブルで Row Level Security を有効化し、auth.uid() = user_id で行レベル制御
-- Supabase SQL Editor で手動実行する

-- ============================================================
-- accounts
-- ============================================================
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select" ON "accounts"
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "accounts_insert" ON "accounts"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "accounts_update" ON "accounts"
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "accounts_delete" ON "accounts"
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- salaries
-- ============================================================
ALTER TABLE "salaries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salaries_select" ON "salaries"
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "salaries_insert" ON "salaries"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "salaries_update" ON "salaries"
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "salaries_delete" ON "salaries"
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- credit_cards
-- ============================================================
ALTER TABLE "credit_cards" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_cards_select" ON "credit_cards"
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "credit_cards_insert" ON "credit_cards"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "credit_cards_update" ON "credit_cards"
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "credit_cards_delete" ON "credit_cards"
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- categories
-- ============================================================
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select" ON "categories"
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "categories_insert" ON "categories"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "categories_update" ON "categories"
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "categories_delete" ON "categories"
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- budgets
-- ============================================================
ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select" ON "budgets"
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "budgets_insert" ON "budgets"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "budgets_update" ON "budgets"
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "budgets_delete" ON "budgets"
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- payments
-- ============================================================
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON "payments"
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "payments_insert" ON "payments"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "payments_update" ON "payments"
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "payments_delete" ON "payments"
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- credit_card_statements
-- ============================================================
ALTER TABLE "credit_card_statements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_card_statements_select" ON "credit_card_statements"
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "credit_card_statements_insert" ON "credit_card_statements"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "credit_card_statements_update" ON "credit_card_statements"
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "credit_card_statements_delete" ON "credit_card_statements"
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- balance_histories
-- ============================================================
ALTER TABLE "balance_histories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "balance_histories_select" ON "balance_histories"
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "balance_histories_insert" ON "balance_histories"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "balance_histories_update" ON "balance_histories"
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "balance_histories_delete" ON "balance_histories"
  FOR DELETE USING (auth.uid()::text = user_id);
