from fastapi import APIRouter, Query

from app.models import HookRecord
from app.services import hook_service

router = APIRouter(prefix="/api", tags=["hooks"])


@router.get("/hooks", response_model=list[HookRecord])
def list_hooks(
    pattern_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return hook_service.get_hooks(pattern_type=pattern_type, limit=limit, offset=offset)
