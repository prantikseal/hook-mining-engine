-- Hooks table: stores mined viral hooks with engagement data
CREATE TABLE IF NOT EXISTS hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_text TEXT NOT NULL,
    hook_text TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    explanation TEXT,
    engagement_score INTEGER NOT NULL DEFAULT 0,
    source_platform TEXT NOT NULL,
    audio_track_name TEXT,
    audio_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_hooks_engagement_score ON hooks (engagement_score DESC);
CREATE INDEX idx_hooks_pattern_type ON hooks (pattern_type);
CREATE INDEX idx_hooks_source_platform ON hooks (source_platform);
CREATE INDEX idx_hooks_created_at ON hooks (created_at DESC);

-- Unique constraint to prevent duplicate hooks
CREATE UNIQUE INDEX idx_hooks_hook_text_unique ON hooks (hook_text);

-- Mining config table: stores per-platform cron settings
CREATE TABLE IF NOT EXISTS mining_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL UNIQUE,
    hashtags TEXT[] NOT NULL DEFAULT '{}',
    max_results INTEGER NOT NULL DEFAULT 500,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default mining configs
INSERT INTO mining_config (platform, hashtags, max_results, enabled) VALUES
    ('tiktok', ARRAY['ecommerce','amazonseller','productphotography','smallbusiness','viral'], 500, true),
    ('instagram', ARRAY['ecommerce','amazonfba','productphotography','brandsuccess'], 500, true)
ON CONFLICT (platform) DO NOTHING;
