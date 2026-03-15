-- Allow multiple commitments and payments per person (per phone).
-- When one_verified_per_phone is false, users can add multiple commitments and submit UTR for each.
ALTER TABLE campaign_settings
  ALTER COLUMN one_verified_per_phone SET DEFAULT false;

UPDATE campaign_settings SET one_verified_per_phone = false WHERE id = 1;
