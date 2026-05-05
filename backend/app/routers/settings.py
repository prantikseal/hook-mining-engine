from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.database import get_supabase, with_retry
from app.models import MiningConfigRecord, MiningConfigUpdate

router = APIRouter(prefix="/api", tags=["settings"])


@router.get("/settings", response_model=list[MiningConfigRecord])
@with_retry()
def get_settings():
    db = get_supabase()
    result = db.table("mining_config").select("*").execute()
    return [MiningConfigRecord(**row) for row in (result.data or [])]


@router.put("/settings/{platform}", response_model=MiningConfigRecord)
@with_retry()
def update_settings(platform: str, body: MiningConfigUpdate):
    db = get_supabase()

    existing = db.table("mining_config").select("id").eq("platform", platform).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail=f"No config found for platform: {platform}")

    updates: dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if body.hashtags is not None:
        updates["hashtags"] = body.hashtags
    if body.search_queries is not None:
        updates["search_queries"] = body.search_queries
    if body.languages is not None:
        updates["languages"] = body.languages
    if body.max_results is not None:
        updates["max_results"] = body.max_results
    if body.enabled is not None:
        updates["enabled"] = body.enabled

    result = db.table("mining_config").update(updates).eq("platform", platform).execute()
    return MiningConfigRecord(**result.data[0])
