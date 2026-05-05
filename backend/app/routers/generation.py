from fastapi import APIRouter, Query

from app.models import GenerateScriptRequest, GenerateScriptResponse, GeneratedScriptRecord
from app.services import hook_service

router = APIRouter(prefix="/api", tags=["generation"])


@router.post("/generate_script", response_model=GenerateScriptResponse)
async def generate_script(request: GenerateScriptRequest):
    return await hook_service.generate_script(
        hook_id=request.hook_id,
        topic=request.topic,
    )


@router.get("/scripts", response_model=list[GeneratedScriptRecord])
def list_scripts(
    hook_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
):
    return hook_service.get_scripts(hook_id=hook_id, limit=limit)
