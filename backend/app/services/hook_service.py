import asyncio
import logging
from collections import defaultdict

from app.database import get_supabase, with_retry
from app.models import (
    GenerateScriptResponse,
    GeneratedScriptRecord,
    HookRecord,
    MineHooksResponse,
    ReelScript,
    SEOCaption,
    ScrapedPost,
    TrendingAudio,
)
from app.services import apify_service, llm_service, media_service

logger = logging.getLogger(__name__)

MIN_POSTS_THRESHOLD = 3  # If fewer posts after filtering, try searching more


async def _retry_once(coro_fn, *args, label: str = "operation", **kwargs):
    """Try a coroutine, retry once on failure, return None if both fail."""
    try:
        return await coro_fn(*args, **kwargs)
    except Exception as e:
        logger.warning(f"{label} failed (attempt 1): {e}")
        try:
            return await coro_fn(*args, **kwargs)
        except Exception as e2:
            logger.error(f"{label} failed (attempt 2), moving on: {e2}")
            return None


async def mine_hooks(
    platform: str,
    hashtags: list[str],
    max_results: int = 500,
    search_queries: list[str] | None = None,
    languages: list[str] | None = None,
) -> MineHooksResponse:
    # Step 1: Scrape + language filter
    posts: list[ScrapedPost] = await _retry_once(
        apify_service.scrape_posts,
        platform, hashtags, max_results, search_queries, languages,
        label="Scrape posts",
    ) or []

    if not posts:
        return MineHooksResponse(hooks_mined=0, hooks=[])

    # Step 2: Relevance filter
    filtered = await _retry_once(
        llm_service.filter_relevant_posts, posts,
        label="Relevance filter",
    )
    if filtered is not None:
        posts = filtered
    # If filter failed, keep all posts rather than losing everything

    if not posts:
        logger.warning("All posts filtered out by relevance check")
        return MineHooksResponse(hooks_mined=0, hooks=[])

    # Step 2b: If too few posts after filtering, try broader search
    if len(posts) < MIN_POSTS_THRESHOLD and search_queries:
        logger.info(f"Only {len(posts)} posts after filtering, trying broader search...")
        broader_queries = [f"{q} tips" for q in search_queries[:2]]
        extra_posts = await _retry_once(
            apify_service.scrape_posts,
            platform, [], max_results, broader_queries, languages,
            label="Broader search",
        ) or []
        if extra_posts:
            # Deduplicate by original_text
            existing_texts = {p.original_text for p in posts}
            for p in extra_posts:
                if p.original_text not in existing_texts:
                    posts.append(p)
                    existing_texts.add(p.original_text)
            logger.info(f"After broader search: {len(posts)} total posts")

    # Step 3: Media processing — transcribe + analyze thumbnails for top 10
    media_data = await _retry_once(
        media_service.process_top_posts, posts, 10,
        label="Media processing",
    ) or {}

    # Step 4: Build enriched post dicts for LLM extraction
    post_dicts: list[dict] = []
    for i, post in enumerate(posts):
        media = media_data.get(i, {})
        post_dicts.append({
            "original_text": post.original_text,
            "engagement_score": post.engagement_score,
            "transcript": media.get("transcript"),
            "visual_texts": media.get("visual_texts"),
        })

    # Step 5: Extract hooks via LLM
    extractions = await _retry_once(
        llm_service.extract_hooks, post_dicts,
        label="Hook extraction",
    )
    if not extractions:
        logger.error("Hook extraction failed completely, aborting")
        return MineHooksResponse(hooks_mined=0, hooks=[])

    # Step 6: Merge all data into records
    records: list[dict] = []
    for i, (post, extraction) in enumerate(zip(posts, extractions)):
        media = media_data.get(i, {})
        records.append({
            "original_text": post.original_text,
            "hook_text": extraction.hook_text,
            "pattern_type": extraction.pattern_type,
            "explanation": extraction.explanation,
            "engagement_score": post.engagement_score,
            "source_platform": post.source_platform,
            "audio_track_name": post.audio_track_name,
            "audio_url": post.audio_url,
            "video_url": post.video_url,
            "thumbnail_url": post.thumbnail_url,
            "transcript": media.get("transcript"),
            "visual_texts": media.get("visual_texts"),
            "view_count": post.view_count,
            "duration_seconds": post.duration_seconds,
        })

    # Step 7: Deduplicate and insert
    db = get_supabase()
    inserted: list[HookRecord] = []
    for record in records:
        try:
            existing = (
                db.table("hooks")
                .select("id")
                .eq("hook_text", record["hook_text"])
                .execute()
            )
            if existing.data:
                continue
            result = db.table("hooks").insert(record).execute()
            if result.data:
                inserted.append(HookRecord(**result.data[0]))
        except Exception as e:
            logger.warning(f"DB insert failed for hook, skipping: {e}")
            continue

    # Log total hooks in DB to confirm we're adding, not replacing
    try:
        total = db.table("hooks").select("id", count="exact").execute()
        total_count = total.count if hasattr(total, 'count') and total.count is not None else len(total.data or [])
        logger.info(f"Mined {len(inserted)} new hooks from {platform} (total in DB: {total_count})")
    except Exception:
        logger.info(f"Mined {len(inserted)} new hooks from {platform}")

    # Step 8: Detect trending audio
    try:
        trending_audio = _detect_trending_audio(db)
    except Exception as e:
        logger.warning(f"Trend detection failed: {e}")
        trending_audio = []

    # Step 9: Auto-generate scripts + captions for top 5 hooks
    top_5 = sorted(inserted, key=lambda h: h.engagement_score, reverse=True)[:5]
    top_trending_name = trending_audio[0].audio_track_name if trending_audio else None

    generated_scripts: list[GenerateScriptResponse] = []
    for hook in top_5:
        script_resp = await _retry_once(
            generate_script_for_hook, hook, top_trending_name,
            label=f"Script generation for hook {hook.id}",
        )
        if script_resp:
            generated_scripts.append(script_resp)

    return MineHooksResponse(
        hooks_mined=len(inserted),
        hooks=inserted,
        generated_scripts=generated_scripts,
        trending_audio=trending_audio,
    )


def _detect_trending_audio(db) -> list[TrendingAudio]:
    result = (
        db.table("hooks")
        .select("id, audio_track_name, audio_url, engagement_score")
        .not_.is_("audio_track_name", "null")
        .order("created_at", desc=True)
        .limit(500)
        .execute()
    )
    rows = result.data or []

    audio_groups: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        audio_groups[row["audio_track_name"]].append(row)

    trending: list[TrendingAudio] = []
    for name, group in audio_groups.items():
        if len(group) < 2:
            continue
        avg_eng = sum(r["engagement_score"] for r in group) / len(group)
        audio_url = next((r["audio_url"] for r in group if r.get("audio_url")), None)
        trending.append(TrendingAudio(
            audio_track_name=name,
            audio_url=audio_url,
            count=len(group),
            avg_engagement=avg_eng,
            example_hook_ids=[r["id"] for r in group[:3]],
        ))

    trending.sort(key=lambda t: t.count, reverse=True)
    return trending[:10]


async def generate_script_for_hook(
    hook: HookRecord, trending_audio: str | None = None
) -> GenerateScriptResponse:
    db = get_supabase()

    # Fetch top 3 example hooks of same pattern_type
    result = (
        db.table("hooks")
        .select("hook_text, engagement_score")
        .eq("pattern_type", hook.pattern_type)
        .order("engagement_score", desc=True)
        .limit(3)
        .execute()
    )
    examples = result.data or []

    visual_style = hook.visual_texts
    topic = "AI-powered e-commerce visuals with Pixii"

    # Generate reel script
    script_data = await llm_service.generate_reel_script(
        pattern_type=hook.pattern_type,
        topic=topic,
        hook_text=hook.hook_text,
        examples=examples,
        trending_audio=trending_audio,
        visual_style=visual_style,
    )

    # Generate SEO caption
    caption_data = await llm_service.generate_seo_caption(
        pattern_type=hook.pattern_type,
        topic=topic,
        hook_line=script_data.get("hook_line", hook.hook_text),
    )

    reel_script = ReelScript(**script_data)
    seo_caption = SEOCaption(**caption_data)

    # Save to DB
    row = db.table("generated_scripts").insert({
        "hook_id": hook.id,
        "topic": topic,
        "hook_line": reel_script.hook_line,
        "hook_text_overlay": reel_script.hook_text_overlay,
        "body_lines": reel_script.body_lines,
        "body_visual_direction": reel_script.body_visual_direction,
        "cta_line": reel_script.cta_line,
        "audio_recommendation": reel_script.audio_recommendation,
        "visual_style_notes": reel_script.visual_style_notes,
        "caption_text": seo_caption.caption_text,
        "caption_hashtags": seo_caption.hashtags,
    }).execute()

    script_id = row.data[0]["id"] if row.data else None

    return GenerateScriptResponse(
        id=script_id,
        reel_script=reel_script,
        seo_caption=seo_caption,
        hook_id=hook.id or "",
        topic=topic,
    )


async def generate_script(hook_id: str, topic: str) -> GenerateScriptResponse:
    db = get_supabase()
    result = db.table("hooks").select("*").eq("id", hook_id).single().execute()
    hook = HookRecord(**result.data)

    # Detect trending audio for recommendation
    trending = _detect_trending_audio(db)
    trending_name = trending[0].audio_track_name if trending else None

    # Fetch examples
    examples_result = (
        db.table("hooks")
        .select("hook_text, engagement_score")
        .eq("pattern_type", hook.pattern_type)
        .order("engagement_score", desc=True)
        .limit(3)
        .execute()
    )
    examples = examples_result.data or []

    script_data = await llm_service.generate_reel_script(
        pattern_type=hook.pattern_type,
        topic=topic,
        hook_text=hook.hook_text,
        examples=examples,
        trending_audio=trending_name,
        visual_style=hook.visual_texts,
    )

    caption_data = await llm_service.generate_seo_caption(
        pattern_type=hook.pattern_type,
        topic=topic,
        hook_line=script_data.get("hook_line", hook.hook_text),
    )

    reel_script = ReelScript(**script_data)
    seo_caption = SEOCaption(**caption_data)

    # Save to DB
    row = db.table("generated_scripts").insert({
        "hook_id": hook_id,
        "topic": topic,
        "hook_line": reel_script.hook_line,
        "hook_text_overlay": reel_script.hook_text_overlay,
        "body_lines": reel_script.body_lines,
        "body_visual_direction": reel_script.body_visual_direction,
        "cta_line": reel_script.cta_line,
        "audio_recommendation": reel_script.audio_recommendation,
        "visual_style_notes": reel_script.visual_style_notes,
        "caption_text": seo_caption.caption_text,
        "caption_hashtags": seo_caption.hashtags,
    }).execute()

    script_id = row.data[0]["id"] if row.data else None

    return GenerateScriptResponse(
        id=script_id,
        reel_script=reel_script,
        seo_caption=seo_caption,
        hook_id=hook_id,
        topic=topic,
    )


@with_retry()
def get_hooks(
    pattern_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[HookRecord]:
    db = get_supabase()
    query = db.table("hooks").select("*").order("engagement_score", desc=True)

    if pattern_type:
        query = query.eq("pattern_type", pattern_type)

    query = query.range(offset, offset + limit - 1)
    result = query.execute()
    return [HookRecord(**row) for row in (result.data or [])]


@with_retry()
def get_scripts(
    hook_id: str | None = None,
    limit: int = 50,
) -> list[GeneratedScriptRecord]:
    db = get_supabase()
    query = db.table("generated_scripts").select("*").order("created_at", desc=True)

    if hook_id:
        query = query.eq("hook_id", hook_id)

    query = query.limit(limit)
    result = query.execute()
    return [GeneratedScriptRecord(**row) for row in (result.data or [])]
