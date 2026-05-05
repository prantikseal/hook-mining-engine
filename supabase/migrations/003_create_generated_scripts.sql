-- Generated scripts table: stores reel scripts + SEO captions linked to hooks
CREATE TABLE IF NOT EXISTS generated_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hook_id UUID NOT NULL REFERENCES hooks(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    hook_line TEXT NOT NULL,
    hook_text_overlay TEXT NOT NULL,
    body_lines TEXT[] NOT NULL DEFAULT '{}',
    body_visual_direction TEXT NOT NULL,
    cta_line TEXT NOT NULL,
    audio_recommendation TEXT,
    visual_style_notes TEXT,
    caption_text TEXT NOT NULL,
    caption_hashtags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_scripts_hook_id ON generated_scripts (hook_id);
CREATE INDEX idx_generated_scripts_created_at ON generated_scripts (created_at DESC);
