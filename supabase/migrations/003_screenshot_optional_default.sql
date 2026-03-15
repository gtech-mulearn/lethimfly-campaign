-- Make payment screenshot optional by default (UTR remains mandatory).
ALTER TABLE campaign_settings
  ALTER COLUMN screenshot_mandatory SET DEFAULT false;

-- Update existing row so current deployments get optional screenshot.
UPDATE campaign_settings SET screenshot_mandatory = false WHERE id = 1;
