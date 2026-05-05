-- Add languages filter to mining_config
ALTER TABLE mining_config ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{en}';
