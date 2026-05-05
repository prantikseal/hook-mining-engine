import json
import logging

import litellm
from pydantic import ValidationError

from app.models import HookExtraction, HookExtractionList, RelevanceResult, ScrapedPost
from app.prompts.brand import get_brand_config
from app.prompts.extraction import (
    EXTRACTION_SYSTEM_PROMPT,
    EXTRACTION_USER_PROMPT,
    format_posts_for_extraction,
)
from app.prompts.generation import (
    CAPTION_USER_PROMPT,
    SCRIPT_USER_PROMPT,
    format_examples_for_generation,
    get_caption_system_prompt,
    get_script_system_prompt,
    pick_tone_and_angle,
)
from app.models import ReelScript, SEOCaption

logger = logging.getLogger(__name__)

PRIMARY_MODEL = "openai/gpt-4o"
FALLBACK_MODEL = "openai/gpt-4o-mini"
BATCH_SIZE = 5


async def _call_llm(
    system: str,
    user: str,
    model: str,
    temperature: float,
    response_schema: dict | None = None,
) -> str:
    kwargs: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
    }
    if response_schema:
        kwargs["response_format"] = {
            "type": "json_schema",
            "json_schema": {"name": "extraction", "schema": response_schema},
        }
    response = await litellm.acompletion(**kwargs)
    return response.choices[0].message.content


async def _call_with_fallback(
    system: str,
    user: str,
    temperature: float,
    response_schema: dict | None = None,
) -> str:
    try:
        return await _call_llm(system, user, PRIMARY_MODEL, temperature, response_schema)
    except Exception as e:
        logger.warning("=" * 60)
        logger.warning(f"!!! PRIMARY MODEL FAILED: {PRIMARY_MODEL} !!!")
        logger.warning(f"!!! Error: {e}")
        logger.warning(f"!!! FALLING BACK TO: {FALLBACK_MODEL}")
        logger.warning("=" * 60)
        return await _call_llm(system, user, FALLBACK_MODEL, temperature, response_schema)


def _build_relevance_prompt() -> str:
    b = get_brand_config()
    primary = ", ".join(b["target_audience"]["primary"])
    demographics = b["target_audience"]["demographics"]
    return f"""You are a content relevance filter for {b['name']} — {b['tagline']}.

Your job: determine if each scraped social media post is RELEVANT to {b['name']}'s target audience and content strategy.

TARGET AUDIENCE:
- {primary}
- Content creators in the brand's niche
- Small business owners
- Digital marketers
- Demographics: {demographics}

RELEVANT content includes:
- Tips, strategies, success stories relevant to the target audience
- Content about the brand's niche (product photography, AI tools, listing optimization, etc.)
- Business growth, side hustle, marketing content
- Viral marketing hooks that could be adapted for the brand's audience

NOT RELEVANT — reject these:
- Non-English content (unless clearly relevant with English keywords)
- Pure entertainment with zero business/marketing angle (dance trends, memes, comedy skits)
- Personal vlogs, relationship content, fitness routines
- Political, religious, or news content
- Spam, scam, or low-quality engagement-bait

Be INCLUSIVE — if a post has a hookable marketing pattern that could be adapted for the brand's audience, mark it relevant even if the original topic differs. We want the HOOK PATTERN, not necessarily the exact topic."""

RELEVANCE_USER_PROMPT = """Review these {count} posts and determine if each is relevant to Pixii's target audience.

{posts}

For each post, return:
- index: the post number (starting from 0)
- relevant: true/false
- reason: brief explanation (10 words max)"""


def _format_posts_for_relevance(posts: list[ScrapedPost]) -> str:
    lines = []
    for i, post in enumerate(posts):
        text = post.original_text[:300]
        lines.append(f"--- Post {i} (engagement: {post.engagement_score}, platform: {post.source_platform}) ---")
        lines.append(f"CAPTION: {text}")
        lines.append("")
    return "\n".join(lines)


async def filter_relevant_posts(posts: list[ScrapedPost]) -> list[ScrapedPost]:
    """Filter posts for contextual relevance using a cheap/fast LLM call."""
    if not posts:
        return []

    RELEVANCE_BATCH = 15
    relevant_posts: list[ScrapedPost] = []

    for i in range(0, len(posts), RELEVANCE_BATCH):
        batch = posts[i : i + RELEVANCE_BATCH]
        formatted = _format_posts_for_relevance(batch)
        user_prompt = RELEVANCE_USER_PROMPT.format(count=len(batch), posts=formatted)

        schema = RelevanceResult.model_json_schema()
        try:
            raw = await _call_llm(
                _build_relevance_prompt(),
                user_prompt,
                FALLBACK_MODEL,  # Use mini model — cheap and fast
                temperature=0.1,
                response_schema=schema,
            )
            parsed = json.loads(raw)
            result = RelevanceResult.model_validate(parsed)

            for check in result.posts:
                if check.relevant and 0 <= check.index < len(batch):
                    relevant_posts.append(batch[check.index])
                elif not check.relevant and 0 <= check.index < len(batch):
                    logger.info(f"Filtered out post {i + check.index}: {check.reason}")

        except Exception as e:
            logger.warning(f"Relevance filter failed for batch {i}, keeping all: {e}")
            relevant_posts.extend(batch)

    logger.info(f"Relevance filter: {len(relevant_posts)}/{len(posts)} posts kept")
    return relevant_posts


async def extract_hooks_batch(post_dicts: list[dict]) -> list[HookExtraction]:
    formatted = format_posts_for_extraction(post_dicts)
    user_prompt = EXTRACTION_USER_PROMPT.format(count=len(post_dicts), posts=formatted)

    schema = HookExtractionList.model_json_schema()
    raw = await _call_with_fallback(
        EXTRACTION_SYSTEM_PROMPT,
        user_prompt,
        temperature=0.3,
        response_schema=schema,
    )

    try:
        parsed = json.loads(raw)
        hooks_raw = parsed.get("hooks", [])
        valid_hooks: list[HookExtraction] = []
        for i, hook_data in enumerate(hooks_raw):
            try:
                valid_hooks.append(HookExtraction.model_validate(hook_data))
            except ValidationError as ve:
                logger.warning(f"Skipping invalid hook {i} in batch: {ve.errors()[0].get('msg', ve)}")
        return valid_hooks
    except (json.JSONDecodeError, ValidationError) as e:
        logger.error(f"Failed to parse extraction response: {e}")
        return []


async def extract_hooks(post_dicts: list[dict]) -> list[HookExtraction]:
    all_hooks: list[HookExtraction] = []
    for i in range(0, len(post_dicts), BATCH_SIZE):
        batch = post_dicts[i : i + BATCH_SIZE]
        hooks = await extract_hooks_batch(batch)
        all_hooks.extend(hooks)
    return all_hooks


async def generate_reel_script(
    pattern_type: str,
    topic: str,
    hook_text: str,
    examples: list[dict],
    trending_audio: str | None = None,
    visual_style: str | None = None,
) -> dict:
    examples_text = format_examples_for_generation(examples)
    trending_audio_section = (
        f"TRENDING AUDIO: \"{trending_audio}\" is trending across multiple viral posts right now. Recommend this track."
        if trending_audio else "No trending audio detected -- suggest an audio style that fits the tone."
    )
    visual_style_section = (
        f"VISUAL REFERENCE from source thumbnail: {visual_style}. Use this as inspiration for visual_style_notes."
        if visual_style else "No visual reference available -- suggest visuals based on what performs well for this pattern type."
    )

    tone, angle = pick_tone_and_angle()

    user_prompt = SCRIPT_USER_PROMPT.format(
        pattern_type=pattern_type,
        topic=topic,
        hook_text=hook_text,
        examples=examples_text,
        trending_audio_section=trending_audio_section,
        visual_style_section=visual_style_section,
        tone=tone,
        angle=angle,
    )

    schema = ReelScript.model_json_schema()
    raw = await _call_with_fallback(
        get_script_system_prompt(),
        user_prompt,
        temperature=0.8,
        response_schema=schema,
    )

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse script response: {raw[:200]}")
        return {
            "hook_line": hook_text,
            "hook_text_overlay": hook_text[:50],
            "body_lines": [f"Here's how Pixii helps with {topic}"],
            "body_visual_direction": "Show Pixii app in action",
            "cta_line": "Try Pixii — link in bio",
        }


async def generate_seo_caption(
    pattern_type: str,
    topic: str,
    hook_line: str,
) -> dict:
    user_prompt = CAPTION_USER_PROMPT.format(
        pattern_type=pattern_type,
        topic=topic,
        hook_line=hook_line,
    )

    schema = SEOCaption.model_json_schema()
    raw = await _call_with_fallback(
        get_caption_system_prompt(),
        user_prompt,
        temperature=0.7,
        response_schema=schema,
    )

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse caption response: {raw[:200]}")
        return {
            "caption_text": f"{hook_line}\n\nTry @pixii_ai to level up your e-commerce visuals.",
            "hashtags": ["pixii", "ecommerce", "ai", "productphotography", "amazonfba"],
        }
