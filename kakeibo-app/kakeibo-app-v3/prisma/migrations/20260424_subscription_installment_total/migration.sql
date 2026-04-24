-- 定期支払に分割払いの総回数を追加
-- NULL は無期限（Netflix 等）、値ありは分割払い（家賃・分割ローン等）

BEGIN;

ALTER TABLE "subscriptions"
  ADD COLUMN "installment_total" INTEGER;

COMMIT;
