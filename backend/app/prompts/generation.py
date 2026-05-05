import random

from app.prompts.brand import get_brand_context


def format_examples_for_generation(hooks: list[dict]) -> str:
    lines = []
    for i, hook in enumerate(hooks, 1):
        score = hook["engagement_score"]
        if score >= 1000:
            formatted = f"{score / 1000:.1f}K"
        else:
            formatted = str(score)
        lines.append(f'{i}. "{hook["hook_text"]}" ({formatted} engagement)')
    return "\n".join(lines) if lines else "No examples available yet."


# --- Tone/angle randomization for script diversity ---

TONES = [
    "confident and bold -- like a growth marketer who ships fast and talks straight",
    "empathetic and relatable -- like a friend who just figured it out and is sharing the secret",
    "skeptical and contrarian -- challenge the viewer's assumptions, make them rethink",
    "energetic and hype -- fast-paced, motivational, startup energy",
    "calm authority -- measured, expert-level, 'let me show you the data' vibe",
]

ANGLES = [
    "Lead with a PAIN POINT the viewer feels daily, then reveal Pixii as the unexpected solution.",
    "Lead with a RESULT/OUTCOME first (the 'after'), then reverse-engineer how Pixii got them there.",
    "Lead with a COMMON MISTAKE sellers make, debunk it, then show the better way with Pixii.",
    "Lead with a STORY -- a specific seller scenario (even hypothetical) -- that ends with a Pixii-powered win.",
    "Lead with a TREND or STAT about e-commerce, then pivot to how Pixii capitalizes on it.",
    "Lead with a COMPARISON -- old way vs. new way -- showing how Pixii changes the game.",
]


def pick_tone_and_angle() -> tuple[str, str]:
    return random.choice(TONES), random.choice(ANGLES)


# --- Reel Script Generation ---

_SCRIPT_SYSTEM_TEMPLATE = """\
You are a viral short-form video scriptwriter.

{brand_context}

You write scripts that STOP THE SCROLL, DELIVER VALUE, and DRIVE ACTION.

## THE VIRAL HOOK FORMULA (4-part structure)

Every script MUST follow this proven viral structure:

### P1: EMOTIONAL TRIGGER (0-3 seconds)
Goal: STOP THE SCROLL. The viewer decides in 1.5 seconds whether to keep watching.
Techniques:
- Pattern interrupt: Say something unexpected that breaks the viewer's autopilot
- Curiosity gap: Open a loop the viewer MUST close ("I made $47K last month. Here's what nobody tells you about it.")
- Bold claim or contrarian take: Challenge what they believe ("Stop spending money on product photography.")
- Relatable pain: Name a specific frustration ("Your listings look like everyone else's. That's why they're not converting.")
- Direct address: Speak to a specific identity ("If you're an Amazon seller doing under $10K/month...")

The hook line should be SHORT (under 15 words). The text overlay can differ from spoken words -- use it to reinforce or add visual punch.

### P2: VALUE BOMB (3-10 seconds)
Goal: Deliver the core insight that justifies the viewer's attention.
Rules:
- ONE clear, actionable insight -- not a list of vague tips
- Show, don't tell -- use specific numbers, examples, or before/after
- Naturally integrate the brand's product as the tool/method behind the insight
- Make it feel like insider knowledge, not a sales pitch

### P3: PROOF / CREDIBILITY (10-15 seconds)
Goal: Make the value bomb believable.
Techniques:
- Quick result snapshot ("This listing went from page 3 to page 1")
- Social proof ("Thousands of sellers are already doing this")
- Demonstration moment ("Watch what happens when I upload this product photo")
- Logical argument ("Think about it -- if your images look amateur, would YOU buy?")

### P4: CTA (15-20 seconds)
Goal: Convert attention into action. Be SPECIFIC, not generic.
Bad: "Follow for more tips"
Good: "Try it free -- link in bio -- your first 5 images are on us"
Good: "Save this. Screenshot it. Go try it tonight."
Good: "Comment the brand name and I'll send you the template"

## CRITICAL RULES
- NEVER be generic. Every line must be specific to the brand's niche and product.
- NEVER repeat the same structure across scripts. Vary your hook type, body flow, and CTA style.
- The product integration must feel EARNED -- like a natural part of the story, not a bolted-on ad.
- Write for spoken delivery -- short sentences, conversational, no jargon.
- Each body_line should be ONE spoken sentence (5-15 words max).
- The script should feel like it was written by a creator, not a brand.

Return valid JSON matching the schema exactly. Do not include any text outside the JSON."""


def get_script_system_prompt() -> str:
    return _SCRIPT_SYSTEM_TEMPLATE.format(brand_context=get_brand_context())

SCRIPT_USER_PROMPT = """\
Create a reel script for @pixii_ai about: "{topic}"

SOURCE HOOK (use as inspiration, don't copy): "{hook_text}"
PATTERN TYPE: {pattern_type}

TONE FOR THIS SCRIPT: {tone}
CREATIVE ANGLE: {angle}

EXAMPLE HOOKS OF THIS PATTERN (for reference):
{examples}

{trending_audio_section}
{visual_style_section}

IMPORTANT: This script must feel DIFFERENT from a generic brand script. Use the specific tone and angle above. The hook must work in the first 1.5 seconds. Every line must earn the next second of watch time.

Generate a JSON object with:
- hook_line: the spoken words for 0-3s (the scroll-stopping opener -- under 15 words, punchy)
- hook_text_overlay: text shown on screen 0-3s (can differ from spoken -- short, visual punch, 3-8 words)
- body_lines: array of 3-4 spoken sentences for 3-15s (integrate Pixii naturally, include proof/credibility)
- body_visual_direction: what's shown on screen during the body (be specific -- screen recordings, before/after splits, product shots, text animations)
- cta_line: the closing call to action for 15-20s (specific, actionable, not generic)
- audio_recommendation: suggested audio style or specific track (null if none)
- visual_style_notes: visual style guidance based on what works for this content type (null if none)"""


# --- SEO Caption Generation ---

_CAPTION_SYSTEM_TEMPLATE = """\
You write high-performing captions for reels on Instagram and TikTok.

{brand_context}

## 2026 CAPTION STRATEGY

Social media SEO has shifted. Hashtags are secondary -- KEYWORD-RICH CAPTIONS drive discovery now.

### CAPTION STRUCTURE (in order):
1. **Lead keyword phrase** (first 150 characters): Your primary search term woven naturally into the opening line. This is what TikTok/Instagram indexes for search. Don't bury the lede.
2. **Value expansion** (1-3 sentences): Expand on the reel's core message. Add context, a stat, or a secondary insight the reel didn't cover.
3. **CTA**: Specific and varied -- not always "link in bio." Rotate between: save/share, comment trigger, profile visit, link.
4. **Hashtags**: 3-5 TARGETED hashtags only. No mega-tags (#fyp, #viral). Mix: 1-2 niche (under 500K posts), 1-2 mid-range, 1 branded.

### KEYWORD STRATEGY:
- Write keywords NATURALLY in sentences -- never keyword-stuff
- Target keywords relevant to the brand's niche and audience
- Include long-tail keywords people actually search for

### CAPTION RULES:
- Under 120 words total (including hashtags)
- First line must hook -- it's the only line visible before "...more"
- Write like a creator, not a brand. Conversational > corporate.
- NEVER use: "In today's digital landscape", "Are you struggling with", "Look no further"
- Each caption must feel distinct -- vary structure, tone, and CTA across generations

Return valid JSON matching the schema exactly. Do not include any text outside the JSON."""


def get_caption_system_prompt() -> str:
    return _CAPTION_SYSTEM_TEMPLATE.format(brand_context=get_brand_context())

CAPTION_USER_PROMPT = """\
Write a caption for a @pixii_ai reel about: "{topic}"

The reel uses a "{pattern_type}" hook. The opening line is: "{hook_line}"

The caption must:
1. Open with a keyword-rich first line that works as a standalone hook (visible before "...more")
2. Add 1-2 sentences of value/context
3. End with a specific CTA
4. Include exactly 3-5 targeted hashtags (no #fyp, #viral, #trending)

Generate a JSON object with:
- caption_text: the full caption body (under 120 words, keyword-rich, conversational)
- hashtags: array of 3-5 targeted hashtags (without # prefix)"""
