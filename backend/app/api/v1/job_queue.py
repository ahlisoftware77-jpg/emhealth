import json
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, Any
from app.services.job_queue_service import job_queue_service
from app.core.security import get_current_user

router = APIRouter(prefix="/job-queue", tags=["Job Queue"])

@router.get("/list")
async def list_jobs(limit: int = 50, user: Dict[str, Any] = Depends(get_current_user)):
    return {"status": "success", "jobs": job_queue_service.list_jobs(limit)}

@router.get("/{job_id}")
async def get_job_detail(job_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan.")
    return {"status": "success", "job": job}

@router.post("/{job_id}/retry")
async def retry_job(job_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.retry_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan.")
    return {"status": "success", "job": job}

@router.get("/stream/events")
async def stream_job_events():
    """
    Server-Sent Events (SSE) stream for realtime job progress and status updates.
    """
    queue = job_queue_service.subscribe()

    async def event_generator():
        try:
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            job_queue_service.unsubscribe(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
