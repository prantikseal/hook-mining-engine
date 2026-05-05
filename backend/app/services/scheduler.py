import logging
from datetime import datetime

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings
from app.database import get_supabase
from app.services import hook_service

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

_last_run: datetime | None = None
_last_run_counts: dict[str, int] = {}


async def _weekly_mine_job():
    global _last_run, _last_run_counts
    logger.info("Starting scheduled weekly mining job")

    db = get_supabase()
    configs = db.table("mining_config").select("*").eq("enabled", True).execute()

    counts = {}
    for config in configs.data or []:
        platform = config["platform"]
        hashtags = config["hashtags"]
        search_queries = config.get("search_queries", [])
        languages = config.get("languages", ["en"])
        max_results = config.get("max_results", 500)

        try:
            result = await hook_service.mine_hooks(
                platform, hashtags, max_results,
                search_queries=search_queries or None,
                languages=languages or None,
            )
            counts[platform] = result.hooks_mined
            logger.info(f"Mined {result.hooks_mined} hooks from {platform}")
        except Exception as e:
            logger.error(f"Failed to mine {platform}: {e}")
            counts[platform] = 0

    _last_run = datetime.utcnow()
    _last_run_counts = counts
    logger.info(f"Weekly mining complete: {counts}")


async def _keep_alive_ping():
    """Ping own health endpoint to prevent Render free tier from sleeping."""
    url = settings.render_external_url
    if not url:
        return
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{url.rstrip('/')}/health", timeout=10)
            logger.debug(f"Keep-alive ping: {resp.status_code}")
    except Exception as e:
        logger.warning(f"Keep-alive ping failed: {e}")


def start_scheduler():
    scheduler.add_job(
        _weekly_mine_job,
        "cron",
        day_of_week=settings.cron_day_of_week,
        hour=settings.cron_hour,
        id="weekly_mine",
        replace_existing=True,
    )

    # Keep Render free tier alive — ping every 5 minutes
    if settings.render_external_url:
        scheduler.add_job(
            _keep_alive_ping,
            "interval",
            minutes=5,
            id="keep_alive",
            replace_existing=True,
        )
        logger.info(f"Keep-alive pinger enabled for {settings.render_external_url}")

    scheduler.start()
    logger.info(
        f"Scheduler started — mining every {settings.cron_day_of_week} at {settings.cron_hour}:00"
    )


def get_cron_status() -> dict:
    job = scheduler.get_job("weekly_mine")
    next_run = job.next_run_time if job else None

    db = get_supabase()
    total = db.table("hooks").select("id", count="exact").execute()

    return {
        "last_run": _last_run.isoformat() if _last_run else None,
        "next_run": next_run.isoformat() if next_run else None,
        "total_hooks": total.count or 0,
    }
