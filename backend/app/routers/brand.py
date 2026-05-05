import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.database import get_supabase, with_retry
from app.models import BrandConfigRecord, BrandConfigUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["brand"])


@router.get("/brand-config", response_model=BrandConfigRecord)
@with_retry()
def get_brand_config():
    db = get_supabase()
    result = db.table("brand_config").select("*").limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No brand config found")
    return _parse_brand_row(result.data[0])


@router.put("/brand-config", response_model=BrandConfigRecord)
@with_retry()
def update_brand_config(body: BrandConfigUpdate):
    db = get_supabase()

    existing = db.table("brand_config").select("id").limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="No brand config found")

    row_id = existing.data[0]["id"]
    updates: dict = {"updated_at": datetime.now(timezone.utc).isoformat()}

    if body.handle is not None:
        updates["handle"] = body.handle
    if body.name is not None:
        updates["name"] = body.name
    if body.tagline is not None:
        updates["tagline"] = body.tagline
    if body.website is not None:
        updates["website"] = body.website
    if body.instagram is not None:
        updates["instagram"] = body.instagram
    if body.product_description is not None:
        updates["product_description"] = body.product_description
    if body.key_features is not None:
        updates["key_features"] = body.key_features
    if body.target_audience is not None:
        updates["target_audience"] = body.target_audience.model_dump()
    if body.voice is not None:
        updates["voice"] = body.voice.model_dump()
    if body.content_pillars is not None:
        updates["content_pillars"] = body.content_pillars
    if body.ctas is not None:
        updates["ctas"] = body.ctas
    if body.branded_hashtag is not None:
        updates["branded_hashtag"] = body.branded_hashtag
    if body.core_hashtags is not None:
        updates["core_hashtags"] = body.core_hashtags

    result = db.table("brand_config").update(updates).eq("id", row_id).execute()
    return _parse_brand_row(result.data[0])


@router.post("/brand-config/regenerate", response_model=BrandConfigRecord)
async def regenerate_brand_config(section: str | None = None):
    """Use AI to regenerate/improve brand config fields.

    Query param `section` can be: "voice", "audience", "content", "ctas", "all".
    If not specified, regenerates all sections.
    """
    import litellm

    db = get_supabase()
    existing = db.table("brand_config").select("*").limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="No brand config found")

    config = _parse_brand_row(existing.data[0])
    target = section or "all"

    system_prompt = """You are a brand strategist specializing in social media for DTC and e-commerce SaaS brands.

Your job: Analyze the current brand profile and IMPROVE it. Generate sharper, more specific, more actionable brand guidelines.

## PRINCIPLES:
1. SPECIFICITY over generality — replace vague statements with concrete, measurable ones
2. DIFFERENTIATION — what makes this brand different? Amplify that.
3. AUTHENTICITY — the voice should feel human, not corporate
4. ACTIONABILITY — every guideline should be directly usable by a content creator or AI
5. AUDIENCE-FIRST — pain points and targeting should reflect real problems, not assumptions

## RULES:
- Keep the brand's core identity (name, handle, product) but sharpen everything else
- Pain points should be hyper-specific with dollar amounts, time costs, or emotional stakes
- Voice guidelines should include examples of good vs bad phrasing
- CTAs should feel native to each platform, not generic
- Content pillars should be specific enough to generate 50+ content ideas each
- Return valid JSON matching the schema exactly. Do not include any text outside the JSON."""

    sections_to_regen = []
    if target in ("all", "voice"):
        sections_to_regen.append("voice")
    if target in ("all", "audience"):
        sections_to_regen.append("target_audience")
    if target in ("all", "content"):
        sections_to_regen.append("content_pillars")
    if target in ("all", "ctas"):
        sections_to_regen.append("ctas")

    user_prompt = f"""Here is the current brand config for {config.name} ({config.handle}):

PRODUCT: {config.product_description}
KEY FEATURES: {json.dumps(config.key_features)}
WEBSITE: {config.website}

CURRENT CONFIG:
- Target Audience: {json.dumps(config.target_audience.model_dump())}
- Voice: {json.dumps(config.voice.model_dump())}
- Content Pillars: {json.dumps(config.content_pillars)}
- CTAs: {json.dumps(config.ctas)}
- Core Hashtags: {json.dumps(config.core_hashtags)}
- Branded Hashtag: {config.branded_hashtag}

SECTIONS TO REGENERATE: {json.dumps(sections_to_regen)}

For each section listed above, generate an IMPROVED version. Keep sections not listed unchanged.

Return a JSON object with ONLY these keys (include all, use current values for sections not being regenerated):
{{
    "target_audience": {{"primary": [...], "secondary": [...], "demographics": "...", "pain_points": [...]}},
    "voice": {{"personality": "...", "do": [...], "dont": [...]}},
    "content_pillars": [...],
    "ctas": [...],
    "core_hashtags": [...]
}}"""

    try:
        response = await litellm.acompletion(
            model="openai/gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.8,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        generated = json.loads(raw)
    except Exception as e:
        logger.error(f"AI regeneration failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI regeneration failed: {e}")

    # Build updates from AI output
    updates: dict = {"updated_at": datetime.now(timezone.utc).isoformat()}

    if "target_audience" in generated and "audience" in sections_to_regen or "target_audience" in sections_to_regen:
        updates["target_audience"] = generated["target_audience"]
    if "voice" in generated and "voice" in sections_to_regen:
        updates["voice"] = generated["voice"]
    if "content_pillars" in generated and "content_pillars" in sections_to_regen:
        updates["content_pillars"] = generated["content_pillars"]
    if "ctas" in generated and "ctas" in sections_to_regen:
        updates["ctas"] = generated["ctas"]
    if "core_hashtags" in generated:
        updates["core_hashtags"] = generated["core_hashtags"]

    row_id = existing.data[0]["id"]
    result = db.table("brand_config").update(updates).eq("id", row_id).execute()
    return _parse_brand_row(result.data[0])


def _parse_brand_row(row: dict) -> BrandConfigRecord:
    """Parse a raw DB row into BrandConfigRecord, handling JSONB fields."""
    # target_audience and voice come as dicts from Supabase JSONB
    if isinstance(row.get("target_audience"), str):
        row["target_audience"] = json.loads(row["target_audience"])
    if isinstance(row.get("voice"), str):
        row["voice"] = json.loads(row["voice"])
    return BrandConfigRecord(**row)
