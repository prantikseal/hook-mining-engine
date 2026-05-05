"""Brand configuration — loaded from Supabase DB, falls back to defaults."""

import logging

logger = logging.getLogger(__name__)

# Hardcoded defaults — used as fallback if DB is unavailable
_DEFAULT_BRAND_CONFIG = {
    "handle": "@pixii_ai",
    "name": "Pixii",
    "tagline": "AI-powered product visuals for e-commerce sellers",
    "website": "pixii.ai",
    "instagram": "https://www.instagram.com/pixii_ai/",
    "product_description": (
        "Pixii is an AI design platform that generates high-converting product visuals, "
        "lifestyle imagery, and listing content for e-commerce sellers. It works across "
        "Amazon, Shopify, TikTok Shop, Walmart, and Etsy."
    ),
    "key_features": [
        "AI product photography — studio-quality shots without a studio",
        "Listing image generation — A+ content, infographics, lifestyle scenes",
        "Background removal and replacement",
        "AI-generated lifestyle imagery for products",
        "Batch processing — generate visuals for entire catalogs",
        "Platform-optimized outputs (Amazon, Shopify, TikTok Shop, Walmart)",
    ],
    "target_audience": {
        "primary": [
            "Amazon FBA sellers",
            "Shopify store owners",
            "TikTok Shop sellers",
            "Walmart Marketplace sellers",
            "Etsy sellers",
        ],
        "secondary": [
            "Product photographers transitioning to AI",
            "E-commerce brand managers",
            "Dropshippers",
            "Private label sellers",
            "Small business owners selling online",
        ],
        "demographics": "25-45, US/India/UK/Australia/Europe, English-speaking",
        "pain_points": [
            "Product photos are expensive ($50-500 per product)",
            "Hiring photographers is slow and inconsistent",
            "DIY photos look amateur and hurt conversions",
            "Listing images don't stand out in crowded marketplaces",
            "Scaling visual content across 100+ SKUs is impossible manually",
        ],
    },
    "voice": {
        "personality": "Confident, practical, slightly bold — like a growth marketer who ships fast",
        "do": [
            "Be specific with numbers and results",
            "Use e-commerce jargon naturally (CTR, conversion rate, listing optimization)",
            "Reference real seller struggles",
            "Make Pixii feel like an insider tool, not a corporate product",
        ],
        "dont": [
            "Sound corporate or salesy",
            "Use 'In today's digital landscape' or similar filler",
            "Be vague — always give specific, actionable content",
            "Over-promise — keep claims realistic",
        ],
    },
    "content_pillars": [
        "Before/After transformations (bad product photos vs Pixii-generated)",
        "Seller success tips (with Pixii as the tool behind the tip)",
        "Behind-the-scenes of how top sellers create listing images",
        "Platform-specific hacks (Amazon A+ content, TikTok Shop visuals)",
        "Cost comparison (traditional photography vs AI-generated)",
    ],
    "ctas": [
        "Try Pixii free — link in bio",
        "Your first 5 images are on us — link in bio",
        "Comment 'PIXII' and I'll send you the link",
        "Save this and try it tonight",
        "Tag a seller friend who needs this",
        "Follow @pixii_ai for more seller hacks",
    ],
    "branded_hashtag": "pixiiai",
    "core_hashtags": [
        "ecommerce", "amazonfba", "shopify", "productphotography",
        "aitools", "onlinebusiness", "sellonline", "amazonsellertools",
        "ecommercetools", "tiktokshop", "listingoptimization",
        "productimages", "aidesign", "ecommerceseller",
    ],
}


def _load_brand_from_db() -> dict | None:
    """Try to load brand config from Supabase. Returns None on failure."""
    try:
        import json
        from app.database import get_supabase
        db = get_supabase()
        result = db.table("brand_config").select("*").limit(1).execute()
        if not result.data:
            return None
        row = result.data[0]
        # Parse JSONB fields if they come as strings
        if isinstance(row.get("target_audience"), str):
            row["target_audience"] = json.loads(row["target_audience"])
        if isinstance(row.get("voice"), str):
            row["voice"] = json.loads(row["voice"])
        return row
    except Exception as e:
        logger.warning(f"Failed to load brand config from DB, using defaults: {e}")
        return None


def get_brand_config() -> dict:
    """Get brand config — from DB if available, else hardcoded defaults."""
    db_config = _load_brand_from_db()
    if db_config:
        # Map DB row to our config dict format
        return {
            "handle": db_config.get("handle", _DEFAULT_BRAND_CONFIG["handle"]),
            "name": db_config.get("name", _DEFAULT_BRAND_CONFIG["name"]),
            "tagline": db_config.get("tagline", _DEFAULT_BRAND_CONFIG["tagline"]),
            "website": db_config.get("website", _DEFAULT_BRAND_CONFIG["website"]),
            "instagram": db_config.get("instagram", _DEFAULT_BRAND_CONFIG["instagram"]),
            "product_description": db_config.get("product_description", _DEFAULT_BRAND_CONFIG["product_description"]),
            "key_features": db_config.get("key_features", _DEFAULT_BRAND_CONFIG["key_features"]),
            "target_audience": db_config.get("target_audience", _DEFAULT_BRAND_CONFIG["target_audience"]),
            "voice": db_config.get("voice", _DEFAULT_BRAND_CONFIG["voice"]),
            "content_pillars": db_config.get("content_pillars", _DEFAULT_BRAND_CONFIG["content_pillars"]),
            "ctas": db_config.get("ctas", _DEFAULT_BRAND_CONFIG["ctas"]),
            "branded_hashtag": db_config.get("branded_hashtag", _DEFAULT_BRAND_CONFIG["branded_hashtag"]),
            "core_hashtags": db_config.get("core_hashtags", _DEFAULT_BRAND_CONFIG["core_hashtags"]),
        }
    return _DEFAULT_BRAND_CONFIG


def get_brand_context() -> str:
    """Return a formatted brand context string for injection into prompts."""
    b = get_brand_config()
    features = "\n".join(f"  - {f}" for f in b["key_features"])
    pain_points = "\n".join(f"  - {p}" for p in b["target_audience"]["pain_points"])
    primary = ", ".join(b["target_audience"]["primary"])
    pillars = "\n".join(f"  - {p}" for p in b["content_pillars"])
    ctas = "\n".join(f"  - {c}" for c in b["ctas"])

    return f"""## BRAND: {b['handle']} ({b['name']})
{b['product_description']}

KEY FEATURES:
{features}

TARGET AUDIENCE: {primary}
Demographics: {b['target_audience']['demographics']}

PAIN POINTS WE SOLVE:
{pain_points}

CONTENT PILLARS:
{pillars}

CTA OPTIONS (rotate these):
{ctas}

VOICE: {b['voice']['personality']}"""
