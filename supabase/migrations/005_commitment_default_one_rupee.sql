-- 1 Rupee Challenge: default commitment amount to ₹1
ALTER TABLE commitments
  ALTER COLUMN amount_committed SET DEFAULT 1;
