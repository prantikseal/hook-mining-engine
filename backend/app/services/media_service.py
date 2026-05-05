import asyncio
import logging

import httpx
import litellm
import openai

from app.config import settings
from app.models import ScrapedPost

logger = logging.getLogger(__name__)

MAX_VIDEO_SIZE = 25 * 1024 * 1024  # 25MB limit for Whisper


async def transcribe_audio(video_url: str) -> str | None:
    # Skip page URLs — they return HTML, not video files
    if any(p in video_url for p in ["/p/", "/reel/", "tiktok.com/@", "tiktok.com/video/"]):
        logger.info(f"Skipping transcription for page URL (not a direct video file): {video_url[:80]}")
        return None

    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            resp = await client.get(video_url)
            resp.raise_for_status()

            # Check content type — skip if HTML
            content_type = resp.headers.get("content-type", "")
            if "text/html" in content_type or "application/json" in content_type:
                logger.warning(f"Not a video file (content-type: {content_type}), skipping: {video_url[:80]}")
                return None

            if len(resp.content) > MAX_VIDEO_SIZE:
                logger.warning(f"Video too large ({len(resp.content)} bytes), skipping transcription")
                return None
            video_bytes = resp.content

        # Determine file extension from content type
        ext = "mp4"
        if "webm" in content_type:
            ext = "webm"
        elif "mpeg" in content_type:
            ext = "mpeg"

        ai_client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        transcript = await ai_client.audio.transcriptions.create(
            model="whisper-1",
            file=(f"video.{ext}", video_bytes),
        )
        text = transcript.text.strip()
        return text if text else None
    except Exception as e:
        logger.warning(f"Transcription failed for {video_url[:80]}: {e}")
        return None


async def analyze_thumbnail(thumbnail_url: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(thumbnail_url)
            resp.raise_for_status()
            image_bytes = resp.content

        import base64
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        content_type = "image/jpeg"
        if thumbnail_url.endswith(".png"):
            content_type = "image/png"

        response = await litellm.acompletion(
            model="openai/gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract ALL visible text from this image — text overlays, captions, watermarks. Return only the text, one line per element. If none, return NO_TEXT.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{content_type};base64,{b64}"},
                        },
                    ],
                }
            ],
            temperature=0.1,
        )
        result = response.choices[0].message.content.strip()
        if result == "NO_TEXT" or not result:
            return None
        return result
    except Exception as e:
        logger.warning(f"Thumbnail analysis failed for {thumbnail_url}: {e}")
        return None


async def process_top_posts(
    posts: list[ScrapedPost], top_n: int = 10
) -> dict[int, dict]:
    semaphore = asyncio.Semaphore(3)

    # Sort by engagement and take top N
    indexed = sorted(enumerate(posts), key=lambda x: x[1].engagement_score, reverse=True)[:top_n]

    async def process_one(idx: int, post: ScrapedPost) -> tuple[int, dict]:
        async with semaphore:
            # Prefer media_url (direct CDN) over video_url (page link) for transcription
            transcribe_url = post.media_url or post.video_url
            transcript_coro = transcribe_audio(transcribe_url) if transcribe_url else asyncio.sleep(0, result=None)
            visual_coro = analyze_thumbnail(post.thumbnail_url) if post.thumbnail_url else asyncio.sleep(0, result=None)

            transcript, visual_texts = await asyncio.gather(transcript_coro, visual_coro)
            return idx, {"transcript": transcript, "visual_texts": visual_texts}

    gather_results = await asyncio.gather(
        *[process_one(idx, post) for idx, post in indexed]
    )
    return {idx: data for idx, data in gather_results}
