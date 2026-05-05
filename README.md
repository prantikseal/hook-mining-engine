# Hook Mining Engine

A production-grade content engine that crawls viral TikTok and Instagram posts, extracts hook patterns, and auto-generates ready-to-shoot reel scripts + SEO captions for [@pixii_ai](https://instagram.com/pixii_ai).

Built for the **Pixii.ai Founding Engineer** assignment.

## What It Does

One click: **scrape > filter > analyze > extract > generate**.

1. **Scrapes** TikTok + Instagram via Apify (hashtag + keyword search, 3 different actors)
2. **Filters** by language (fast-langdetect) and relevance (GPT-4o-mini)
3. **Analyzes media** — Whisper transcribes spoken hooks, GPT-4o Vision reads text overlays from thumbnails
4. **Extracts hooks** — classifies into 8 pattern types (Contrarian, How-To, Story-Open, etc.)
5. **Detects trends** — repeated audio tracks across posts = trending
6. **Auto-generates 5 reel scripts** for the top hooks — 4-part viral formula (Hook → Value Bomb → Proof → CTA) + SEO captions with 2026 keyword strategy
7. **Runs weekly** via APScheduler cron job

The entire pipeline is **brand-aware** — voice, audience, pain points, CTAs are stored in Supabase and dynamically injected into every prompt. Edit the brand profile in the UI, and all future generations adapt.

## Architecture

```
Frontend (Next.js 16 + Tailwind + shadcn/ui)
    ↕ REST API
Backend (FastAPI + Python 3.11)
    ├── Apify (TikTok scraper, Instagram API scraper, Instagram keyword scraper)
    ├── OpenAI GPT-4o (extraction, script generation)
    ├── OpenAI GPT-4o-mini (relevance filtering)
    ├── OpenAI Whisper (video transcription)
    ├── OpenAI GPT-4o Vision (thumbnail text extraction)
    ├── LiteLLM (model routing + automatic fallback)
    └── APScheduler (weekly auto-mining)
    ↕
Supabase (hooks, generated_scripts, mining_config, brand_config)
```

## APIs & Tools Used


| Tool                   | Purpose                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| **Apify**              | TikTok + Instagram scraping (3 actors)                             |
| **OpenAI GPT-4o**      | Hook extraction, reel script generation, thumbnail vision analysis |
| **OpenAI GPT-4o-mini** | Relevance filtering (cheap/fast)                                   |
| **OpenAI Whisper**     | Video audio transcription                                          |
| **LiteLLM**            | Model routing with automatic fallback                              |
| **Supabase**           | Database (hooks, scripts, config, brand profile)                   |
| **APScheduler**        | Weekly auto-mining cron                                            |
| **fast-langdetect**    | Language detection for non-English filtering                       |


## Screenshots

### Hook Library
<img width="1800" height="1040" alt="image" src="https://github.com/user-attachments/assets/eecc582f-46fd-4758-adae-cb1cd2d78e66" />


Thumbnails, pattern badges, engagement scores, transcript snippets, video links.

### Mining Results

<img width="689" height="783" alt="image" src="https://github.com/user-attachments/assets/c8eba888-ca0e-43cb-ac34-c6e5ab66c03b" />


After mining: trending audio detection + 5 auto-generated reel scripts with SEO captions.

### Brand Config

<img width="1306" height="995" alt="image" src="https://github.com/user-attachments/assets/6e16b6ec-6f71-46c3-828f-b9c824373898" />

<img width="1263" height="1029" alt="image" src="https://github.com/user-attachments/assets/0753f0e0-432e-43ca-bd26-ed75804018a5" />

<img width="938" height="1002" alt="image" src="https://github.com/user-attachments/assets/5f42744f-72f3-467e-8d4d-4567590ca05c" />

<img width="989" height="878" alt="image" src="https://github.com/user-attachments/assets/a2279d39-d92f-456f-a623-46f936378779" />



Editable brand profile with AI regeneration — voice, audience, content pillars, CTAs.

### Mining Settings

Tag-based inputs for hashtags and keywords per platform.

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase project (free tier works)
- API keys: OpenAI, Apify, (optional: Anthropic)

### 1. Clone & configure

```bash
git clone https://github.com/your-username/hook-mining-engine.git
cd hook-mining-engine
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Database setup

Run these SQL files in order in your Supabase SQL editor:

```
supabase/migrations/001_create_hooks_table.sql
supabase/migrations/002_add_media_and_trends.sql
supabase/migrations/003_create_generated_scripts.sql
supabase/migrations/004_add_languages_config.sql
supabase/migrations/005_create_brand_config.sql
supabase/migrations/006_seed_mining_keywords.sql
```

### 3. Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
cp ../.env .env
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Key Design Decisions

**"What does the user need?"** — A social media manager doesn't want a database of hooks. They want ready-to-shoot scripts. So mining = scrape + analyze + extract + generate, all in one flow.

**Brand-aware pipeline** — Brand config lives in Supabase, not hardcoded. Edit voice/audience/CTAs in the UI → all future scripts adapt. AI can regenerate any section.

**Resilient by default** — Every async step retries once on failure then moves on. One failed transcription doesn't block 200 hooks. Individual LLM parse errors skip the bad item, not the whole batch.

**Research-backed prompts** — The 4-part viral hook formula (Emotional Trigger → Value Bomb → Proof → CTA) with tone/angle randomization (5 tones x 6 angles = 30 unique combos) prevents repetitive scripts.

**Cost-conscious** — Language filter runs before any LLM call. Relevance filter uses GPT-4o-mini (cheap). Only top 10 posts get media analysis. Only top 5 hooks get scripts generated.

## If I Had More Time

- **A/B tracking** — Track which scripts get posted and their performance, feed results back into generation
- **Multi-brand support** — Brand config is already in Supabase; extend to multiple brands per account
- **Webhook notifications** — Slack/email alert when weekly mining finds high-engagement hooks
- **Export to scheduling tools** — One-click export scripts + captions to Buffer/Later/Hootsuite

## Author

**Prantik Seal** — [prantik0004@gmail.com](mailto:prantik0004@gmail.com)
