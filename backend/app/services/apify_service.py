import asyncio
import logging

from apify_client import ApifyClient

from app.config import settings
from app.models import ScrapedPost

logger = logging.getLogger(__name__)

ACTOR_MAP = {
    "tiktok": "clockworks/tiktok-scraper",
    # Official API scraper — supports resultsType "reels" for reels-only with full metrics
    "instagram_api": "apify/instagram-api-scraper",
    # Keyword-based reels search — returns only reels, no login needed
    "instagram_keyword_reels": "patient_discovery/instagram-search-reels",
}


def _extract_tiktok_video_url(item: dict) -> str | None:
    """Extract video URL from TikTok item — tries multiple known field paths."""
    return (
        item.get("webVideoUrl")
        or item.get("videoUrl")
        or item.get("video_url")
        or item.get("url")
    )


def _extract_tiktok_thumbnail(item: dict) -> str | None:
    """Extract thumbnail/cover URL from TikTok item — tries nested videoMeta and top-level."""
    # videoMeta nested covers (clockworks scraper)
    video_meta = item.get("videoMeta", {}) or {}
    cover = (
        video_meta.get("originalCoverUrl")
        or video_meta.get("coverUrl")
    )
    if cover:
        return cover

    # Top-level cover fields
    return (
        item.get("coverUrl")
        or item.get("cover")
        or item.get("originCover")
        or item.get("dynamicCover")
    )


def _run_tiktok_scraper(
    client: ApifyClient, hashtags: list[str], max_results: int, search_queries: list[str] | None = None
) -> list[ScrapedPost]:
    run_input: dict = {
        "resultsPerPage": max_results,
    }
    if hashtags:
        run_input["hashtags"] = hashtags
    if search_queries:
        run_input["searchQueries"] = search_queries

    run = client.actor(ACTOR_MAP["tiktok"]).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

    # Log first item keys for debugging field names
    if items:
        sample = items[0]
        logger.info(f"TikTok scraper: {len(items)} items, sample keys: {sorted(sample.keys())}")
        video_meta = sample.get("videoMeta", {}) or sample.get("video", {}) or {}
        if video_meta:
            logger.info(f"TikTok videoMeta/video keys: {sorted(video_meta.keys()) if isinstance(video_meta, dict) else type(video_meta)}")
        media_urls = sample.get("mediaUrls")
        if media_urls:
            logger.info(f"TikTok mediaUrls sample ({len(media_urls)} items): {[u[:80] if isinstance(u, str) else u for u in media_urls[:3]]}")

    posts = []
    seen_urls: set[str] = set()
    for item in items:
        text = item.get("text") or item.get("desc") or ""
        if not text or len(text) < 10:
            continue

        video_url = _extract_tiktok_video_url(item)
        if video_url and video_url in seen_urls:
            continue
        if video_url:
            seen_urls.add(video_url)

        likes = item.get("diggCount", 0) or item.get("likes", 0) or 0
        comments = item.get("commentCount", 0) or item.get("comments", 0) or 0
        shares = item.get("shareCount", 0) or item.get("shares", 0) or 0
        engagement = int(likes) + (int(comments) * 2) + (int(shares) * 3)

        music = item.get("music", {}) or item.get("musicMeta", {}) or {}
        video_meta = item.get("videoMeta", {}) or item.get("video", {}) or {}
        duration = video_meta.get("duration")
        try:
            duration = int(float(duration)) if duration else None
        except (ValueError, TypeError):
            duration = None

        thumbnail = _extract_tiktok_thumbnail(item)

        # mediaUrls contains direct CDN video URLs (downloadable, for transcription)
        media_urls = item.get("mediaUrls") or []
        media_url = None
        for mu in media_urls:
            if isinstance(mu, str) and ("video" in mu.lower() or mu.endswith(".mp4")):
                media_url = mu
                break
        # Fallback: try any mediaUrl
        if not media_url and media_urls:
            media_url = media_urls[0] if isinstance(media_urls[0], str) else None

        posts.append(ScrapedPost(
            original_text=text,
            engagement_score=engagement,
            source_platform="tiktok",
            audio_track_name=music.get("title") or music.get("musicName"),
            audio_url=music.get("playUrl") or music.get("musicUrl"),
            video_url=video_url,
            media_url=media_url,
            thumbnail_url=thumbnail,
            view_count=item.get("playCount", 0) or item.get("plays", 0) or 0,
            duration_seconds=duration,
        ))
    return posts


def _extract_video_cdn_url(item: dict) -> str | None:
    """Extract the actual video CDN URL from video_versions, falling back to video_url fields."""
    # Prefer video_versions CDN URL (works for transcription + direct playback)
    video_versions = item.get("video_versions") or item.get("videoVersions") or []
    if video_versions and isinstance(video_versions, list):
        for v in video_versions:
            if isinstance(v, dict) and v.get("url"):
                return v["url"]

    # Fall back to direct URL fields
    url = (
        item.get("videoUrl")
        or item.get("video_url")
        or item.get("videoPlayUrl")
        or item.get("video_play_url")
    )
    return url if url else None


def _parse_instagram_item(item: dict) -> ScrapedPost | None:
    """Parse a single Instagram item into a ScrapedPost. Returns None if not a reel/video or too short."""
    video_url = _extract_video_cdn_url(item)
    if not video_url:
        return None

    # Try multiple caption field names across different actors
    caption_raw = item.get("caption") or item.get("text") or item.get("description") or ""
    if isinstance(caption_raw, dict):
        text = caption_raw.get("text", "") or ""
    else:
        text = str(caption_raw)
    if not text or len(text) < 10:
        return None

    # Engagement metrics — try all known field names
    likes = item.get("likesCount") or item.get("likes") or item.get("like_count") or 0
    comments = item.get("commentsCount") or item.get("comments") or item.get("comment_count") or 0
    shares = item.get("sharesCount") or item.get("shares") or item.get("share_count") or 0
    try:
        engagement = int(likes) + (int(comments) * 2) + (int(shares) * 3)
    except (ValueError, TypeError):
        engagement = 0

    # View/play count
    try:
        view_count = int(
            item.get("videoViewCount")
            or item.get("videoPlayCount")
            or item.get("views")
            or item.get("playCount")
            or item.get("play_count")
            or item.get("ig_play_count")
            or item.get("video_play_count")
            or 0
        )
    except (ValueError, TypeError):
        view_count = 0

    # Music/audio info
    music_info = item.get("musicInfo", {}) or item.get("music_metadata", {}) or {}
    audio_info = item.get("audio", {}) or {}

    # Duration
    duration = item.get("duration_seconds") or item.get("video_duration") or item.get("videoDuration")
    try:
        duration = int(float(duration)) if duration else None
    except (ValueError, TypeError):
        duration = None

    # Thumbnail
    thumbnail = (
        item.get("displayUrl")
        or item.get("thumbnailUrl")
        or item.get("thumbnail_url")
        or item.get("display_url")
        or item.get("imageUrl")
    )

    return ScrapedPost(
        original_text=text,
        engagement_score=engagement,
        source_platform="instagram",
        audio_track_name=music_info.get("music_title") or music_info.get("title") or audio_info.get("title"),
        audio_url=music_info.get("music_url") or audio_info.get("url"),
        video_url=video_url,
        thumbnail_url=thumbnail,
        view_count=view_count,
        duration_seconds=duration,
    )


def _run_instagram_reels_scraper(
    client: ApifyClient, hashtags: list[str], max_results: int
) -> list[ScrapedPost]:
    """Scrape Instagram REELS by hashtags using apify/instagram-api-scraper with resultsType=reels.
    This returns only reels with full engagement metrics (likes, views, plays, shares)."""
    if not hashtags:
        return []

    clean_tags = [tag.strip().lstrip("#") for tag in hashtags if tag.strip()]
    if not clean_tags:
        return []

    # Build hashtag URLs for the API scraper
    hashtag_urls = [f"https://www.instagram.com/explore/tags/{tag}/" for tag in clean_tags]

    run_input = {
        "directUrls": hashtag_urls,
        "resultsType": "reels",
        "resultsLimit": max_results,
    }

    logger.info(f"Instagram reels scrape via API scraper: {clean_tags} (limit: {max_results})")

    try:
        run = client.actor(ACTOR_MAP["instagram_api"]).call(run_input=run_input)
        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    except Exception as e:
        logger.error(f"Instagram API scraper failed: {e}")
        return []

    if items:
        logger.info(f"API scraper returned {len(items)} items, sample keys: {list(items[0].keys())[:20]}")

    posts = []
    seen_urls: set[str] = set()
    for item in items:
        post = _parse_instagram_item(item)
        if post is None:
            continue
        if post.video_url and post.video_url in seen_urls:
            continue
        if post.video_url:
            seen_urls.add(post.video_url)
        posts.append(post)
        if len(posts) >= max_results:
            break

    logger.info(f"Instagram hashtag reels: {len(posts)} parsed from {len(items)} raw")
    return posts


def _run_instagram_keyword_scraper(
    client: ApifyClient, search_queries: list[str], max_results: int
) -> list[ScrapedPost]:
    """Scrape Instagram reels by keyword using patient_discovery/instagram-search-reels.
    This actor returns ONLY reels — no images."""
    if not search_queries:
        return []

    per_query = max(max_results // len(search_queries), 10)
    all_posts: list[ScrapedPost] = []
    seen_urls: set[str] = set()

    for query in search_queries:
        run_input = {
            "keyword": query.strip(),
            "resultsLimit": per_query,
        }
        logger.info(f"Instagram keyword reels search: '{query.strip()}' (limit: {per_query})")

        try:
            run = client.actor(ACTOR_MAP["instagram_keyword_reels"]).call(run_input=run_input)
            items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
        except Exception as e:
            logger.error(f"Instagram keyword search failed for '{query}': {e}")
            continue

        if items:
            logger.info(f"Keyword scraper: {len(items)} items returned, sample keys: {sorted(items[0].keys())[:25]}")

        for item in items:
            post = _parse_instagram_item(item)
            if post is None:
                continue
            if post.video_url and post.video_url in seen_urls:
                continue
            if post.video_url:
                seen_urls.add(post.video_url)
            all_posts.append(post)

        if len(all_posts) >= max_results:
            break

    logger.info(f"Instagram keywords: {len(all_posts)} reels from {len(search_queries)} queries")
    return all_posts[:max_results]


def _run_instagram_scraper(
    client: ApifyClient, hashtags: list[str], max_results: int, search_queries: list[str] | None = None
) -> list[ScrapedPost]:
    """Run Instagram scrapers — API scraper for hashtag reels, keyword scraper for search.
    Both return only reels with engagement metrics."""
    all_posts: list[ScrapedPost] = []
    seen_urls: set[str] = set()

    # Run hashtag reels scraper (uses apify/instagram-api-scraper with resultsType=reels)
    if hashtags:
        hashtag_posts = _run_instagram_reels_scraper(client, hashtags, max_results)
        for post in hashtag_posts:
            if not post.video_url or post.video_url not in seen_urls:
                if post.video_url:
                    seen_urls.add(post.video_url)
                all_posts.append(post)

    # Run keyword reels scraper
    if search_queries:
        remaining = max(max_results - len(all_posts), 10)
        keyword_posts = _run_instagram_keyword_scraper(client, search_queries, remaining)
        for post in keyword_posts:
            if not post.video_url or post.video_url not in seen_urls:
                if post.video_url:
                    seen_urls.add(post.video_url)
                all_posts.append(post)

    return all_posts[:max_results]


def _detect_language(text: str) -> str | None:
    """Detect language of text. Returns lowercase ISO 639-1 code (e.g. 'en', 'es') or None."""
    try:
        from fast_langdetect import detect_language
        return detect_language(text).lower()
    except Exception:
        return None


def _filter_by_language(posts: list[ScrapedPost], languages: list[str]) -> list[ScrapedPost]:
    """Filter posts to only keep those matching the allowed languages."""
    if not languages:
        return posts

    allowed = {lang.lower().strip() for lang in languages}
    kept = []
    removed = 0
    for post in posts:
        lang = _detect_language(post.original_text)
        if lang is None or lang in allowed:
            kept.append(post)
        else:
            removed += 1

    if removed:
        logger.info(f"Language filter: removed {removed}/{len(posts)} posts (allowed: {allowed})")
    return kept


async def scrape_posts(
    platform: str,
    hashtags: list[str],
    max_results: int = 500,
    search_queries: list[str] | None = None,
    languages: list[str] | None = None,
) -> list[ScrapedPost]:
    client = ApifyClient(settings.apify_api_token)

    if platform == "tiktok":
        posts = await asyncio.to_thread(
            _run_tiktok_scraper, client, hashtags, max_results, search_queries
        )
    elif platform == "instagram":
        posts = await asyncio.to_thread(
            _run_instagram_scraper, client, hashtags, max_results, search_queries
        )
    else:
        raise ValueError(f"Unsupported platform: {platform}")

    # Filter by language BEFORE any LLM calls (saves cost)
    if languages:
        posts = _filter_by_language(posts, languages)

    # Sort by engagement descending — trending/viral content first
    posts.sort(key=lambda p: p.engagement_score, reverse=True)
    logger.info(f"Scraped {len(posts)} posts from {platform}")
    return posts
