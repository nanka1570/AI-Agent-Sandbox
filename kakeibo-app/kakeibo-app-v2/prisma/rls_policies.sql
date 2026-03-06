-- RLS ポリシー設定
-- v2 全テーブルに Row Level Security を適用
-- ※ Supabase SQL Editor で手動実行する

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
