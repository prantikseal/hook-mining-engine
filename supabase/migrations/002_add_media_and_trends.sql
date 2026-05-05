-- V2: Add media fields to hooks for video/thumbnail/transcript analysis
ALTER TABLE hooks ADD COLUMN video_url TEXT;
ALTER TABLE hooks ADD COLUMN thumbnail_url TEXT;
ALTER TABLE hooks ADD COLUMN transcript TEXT;
ALTER TABLE hooks ADD COLUMN visual_texts TEXT;
ALTER TABLE hooks ADD COLUMN view_count BIGINT DEFAULT 0;
ALTER TABLE hooks ADD COLUMN duration_seconds INTEGER;

-- Index for trending audio detection
CREATE INDEX idx_hooks_audio_track_name ON hooks (audio_track_name);

-- Add keyword search support to mining_config
ALTER TABLE mining_config ADD COLUMN search_queries TEXT[] NOT NULL DEFAULT '{}';
