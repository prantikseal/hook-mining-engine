from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


# --- Relevance Filter (LLM output) ---

class RelevanceCheck(BaseModel):
    index: int
    relevant: bool
    reason: str


class RelevanceResult(BaseModel):
    posts: list[RelevanceCheck]


# --- Hook Extraction (LLM output) ---

class HookExtraction(BaseModel):
    hook_text: str = Field(description="The distilled hook line")
    pattern_type: Literal[
        "Contrarian", "How-To", "Story-Open", "Social-Proof",
        "FOMO", "Identity", "Pattern-Interrupt", "Question"
    ]
    explanation: str = Field(description="Why this hook works psychologically")


class HookExtractionList(BaseModel):
    hooks: list[HookExtraction]


# --- Scraped post (normalized from Apify) ---

class ScrapedPost(BaseModel):
    original_text: str
    engagement_score: int
    source_platform: Literal["tiktok", "instagram"]
    audio_track_name: str | None = None
    audio_url: str | None = None
    video_url: str | None = None
    media_url: str | None = None  # Direct downloadable video CDN URL (for transcription)
    thumbnail_url: str | None = None
    view_count: int = 0
    duration_seconds: int | None = None


# --- Hook record (full DB row) ---

class HookRecord(BaseModel):
    id: str | None = None
    original_text: str
    hook_text: str
    pattern_type: str
    explanation: str | None = None
    engagement_score: int = 0
    source_platform: Literal["tiktok", "instagram"]
    audio_track_name: str | None = None
    audio_url: str | None = None
    video_url: str | None = None
    thumbnail_url: str | None = None
    transcript: str | None = None
    visual_texts: str | None = None
    view_count: int = 0
    duration_seconds: int | None = None
    created_at: datetime | None = None


# --- Mining ---

class MineHooksRequest(BaseModel):
    platform: Literal["tiktok", "instagram"]
    hashtags: list[str] = Field(default_factory=list)
    search_queries: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=lambda: ["en"])
    max_results: int = Field(default=500, ge=1, le=1000)

    @model_validator(mode="after")
    def require_at_least_one_source(self):
        if not self.hashtags and not self.search_queries:
            raise ValueError("At least one of hashtags or search_queries is required")
        return self


# --- Script Generation ---

class GenerateScriptRequest(BaseModel):
    hook_id: str
    topic: str


class ReelScript(BaseModel):
    hook_line: str
    hook_text_overlay: str
    body_lines: list[str]
    body_visual_direction: str
    cta_line: str
    audio_recommendation: str | None = None
    visual_style_notes: str | None = None


class SEOCaption(BaseModel):
    caption_text: str
    hashtags: list[str]


class GenerateScriptResponse(BaseModel):
    id: str | None = None
    reel_script: ReelScript
    seo_caption: SEOCaption
    hook_id: str
    topic: str


class GeneratedScriptRecord(BaseModel):
    id: str
    hook_id: str
    topic: str
    hook_line: str
    hook_text_overlay: str
    body_lines: list[str]
    body_visual_direction: str
    cta_line: str
    audio_recommendation: str | None = None
    visual_style_notes: str | None = None
    caption_text: str
    caption_hashtags: list[str]
    created_at: datetime | None = None


# --- Trends ---

class TrendingAudio(BaseModel):
    audio_track_name: str
    audio_url: str | None = None
    count: int
    avg_engagement: float
    example_hook_ids: list[str]


class MineHooksResponse(BaseModel):
    hooks_mined: int
    hooks: list[HookRecord]
    generated_scripts: list[GenerateScriptResponse] = Field(default_factory=list)
    trending_audio: list[TrendingAudio] = Field(default_factory=list)


# --- Settings ---

class MiningConfigRecord(BaseModel):
    id: str | None = None
    platform: str
    hashtags: list[str]
    search_queries: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=lambda: ["en"])
    max_results: int = 500
    enabled: bool = True
    updated_at: datetime | None = None


class MiningConfigUpdate(BaseModel):
    hashtags: list[str] | None = None
    search_queries: list[str] | None = None
    languages: list[str] | None = None
    max_results: int | None = None
    enabled: bool | None = None


# --- Brand Config ---

class TargetAudience(BaseModel):
    primary: list[str] = Field(default_factory=list)
    secondary: list[str] = Field(default_factory=list)
    demographics: str = ""
    pain_points: list[str] = Field(default_factory=list)


class VoiceConfig(BaseModel):
    personality: str = ""
    do: list[str] = Field(default_factory=list)
    dont: list[str] = Field(default_factory=list)


class BrandConfigRecord(BaseModel):
    id: str | None = None
    handle: str = "@pixii_ai"
    name: str = "Pixii"
    tagline: str = ""
    website: str = ""
    instagram: str = ""
    product_description: str = ""
    key_features: list[str] = Field(default_factory=list)
    target_audience: TargetAudience = Field(default_factory=TargetAudience)
    voice: VoiceConfig = Field(default_factory=VoiceConfig)
    content_pillars: list[str] = Field(default_factory=list)
    ctas: list[str] = Field(default_factory=list)
    branded_hashtag: str = ""
    core_hashtags: list[str] = Field(default_factory=list)
    updated_at: datetime | None = None


class BrandConfigUpdate(BaseModel):
    handle: str | None = None
    name: str | None = None
    tagline: str | None = None
    website: str | None = None
    instagram: str | None = None
    product_description: str | None = None
    key_features: list[str] | None = None
    target_audience: TargetAudience | None = None
    voice: VoiceConfig | None = None
    content_pillars: list[str] | None = None
    ctas: list[str] | None = None
    branded_hashtag: str | None = None
    core_hashtags: list[str] | None = None


# --- Cron Status ---

class CronStatusResponse(BaseModel):
    last_run: datetime | None = None
    next_run: datetime | None = None
    total_hooks: int = 0
