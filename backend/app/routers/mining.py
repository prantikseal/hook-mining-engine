import logging

from fastapi import APIRouter

from app.models import CronStatusResponse, MineHooksRequest, MineHooksResponse
from app.services import hook_service
from app.services.scheduler import get_cron_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["mining"])


@router.post("/mine_hooks", response_model=MineHooksResponse)
async def mine_hooks(request: MineHooksRequest):
    try:
        return await hook_service.mine_hooks(
            platform=request.platform,
            hashtags=request.hashtags,
            max_results=request.max_results,
            search_queries=request.search_queries or None,
            languages=request.languages or None,
        )
    except Exception as e:
        logger.error(f"mine_hooks failed: {type(e).__name__}: {e}", exc_info=True)
        raise


@router.get("/cron/status", response_model=CronStatusResponse)
def cron_status():
    return get_cron_status()
