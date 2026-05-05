export interface HookRecord {
  id: string;
  original_text: string;
  hook_text: string;
  pattern_type: string;
  explanation: string | null;
  engagement_score: number;
  source_platform: "tiktok" | "instagram";
  audio_track_name: string | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  transcript: string | null;
  visual_texts: string | null;
  view_count: number;
  duration_seconds: number | null;
  created_at: string;
}

export interface MineHooksRequest {
  platform: "tiktok" | "instagram";
  hashtags: string[];
  search_queries?: string[];
  languages?: string[];
  max_results: number;
}

export interface MineHooksResponse {
  hooks_mined: number;
  hooks: HookRecord[];
  generated_scripts: GenerateScriptResponse[];
  trending_audio: TrendingAudio[];
}

export interface GenerateScriptRequest {
  hook_id: string;
  topic: string;
}

export interface ReelScript {
  hook_line: string;
  hook_text_overlay: string;
  body_lines: string[];
  body_visual_direction: string;
  cta_line: string;
  audio_recommendation: string | null;
  visual_style_notes: string | null;
}

export interface SEOCaption {
  caption_text: string;
  hashtags: string[];
}

export interface GenerateScriptResponse {
  id: string | null;
  reel_script: ReelScript;
  seo_caption: SEOCaption;
  hook_id: string;
  topic: string;
}

export interface TrendingAudio {
  audio_track_name: string;
  audio_url: string | null;
  count: number;
  avg_engagement: number;
  example_hook_ids: string[];
}

export interface GeneratedScriptRecord {
  id: string;
  hook_id: string;
  topic: string;
  hook_line: string;
  hook_text_overlay: string;
  body_lines: string[];
  body_visual_direction: string;
  cta_line: string;
  audio_recommendation: string | null;
  visual_style_notes: string | null;
  caption_text: string;
  caption_hashtags: string[];
  created_at: string;
}

export interface CronStatusResponse {
  last_run: string | null;
  next_run: string | null;
  total_hooks: number;
}

export interface MiningConfigRecord {
  id: string;
  platform: string;
  hashtags: string[];
  search_queries: string[];
  languages: string[];
  max_results: number;
  enabled: boolean;
  updated_at: string;
}

export interface MiningConfigUpdate {
  hashtags?: string[];
  search_queries?: string[];
  languages?: string[];
  max_results?: number;
  enabled?: boolean;
}

export interface TargetAudience {
  primary: string[];
  secondary: string[];
  demographics: string;
  pain_points: string[];
}

export interface VoiceConfig {
  personality: string;
  do: string[];
  dont: string[];
}

export interface BrandConfigRecord {
  id: string | null;
  handle: string;
  name: string;
  tagline: string;
  website: string;
  instagram: string;
  product_description: string;
  key_features: string[];
  target_audience: TargetAudience;
  voice: VoiceConfig;
  content_pillars: string[];
  ctas: string[];
  branded_hashtag: string;
  core_hashtags: string[];
  updated_at: string | null;
}

export interface BrandConfigUpdate {
  handle?: string;
  name?: string;
  tagline?: string;
  website?: string;
  instagram?: string;
  product_description?: string;
  key_features?: string[];
  target_audience?: TargetAudience;
  voice?: VoiceConfig;
  content_pillars?: string[];
  ctas?: string[];
  branded_hashtag?: string;
  core_hashtags?: string[];
}
