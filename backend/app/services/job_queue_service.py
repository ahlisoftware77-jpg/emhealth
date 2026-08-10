import time
import asyncio
import uuid
from typing import Dict, Any, List, Optional, Callable
from app.models.schemas import JobResponse
import logging

logger = logging.getLogger(__name__)

class JobQueueService:
    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._subscribers: List[asyncio.Queue] = []

    def create_job(self, task_type: str, message: str = "Tugas ditempatkan dalam antrean") -> Dict[str, Any]:
        job_id = f"job-{uuid.uuid4().hex[:10]}"
        now = time.time()
        job_data = {
            "job_id": job_id,
            "task_type": task_type,
            "status": "Waiting",
            "progress": 0.0,
            "message": message,
            "result_url": None,
            "download_filename": None,
            "created_at": now,
            "updated_at": now,
            "error_detail": None
        }
        self._jobs[job_id] = job_data
        self.notify_subscribers(job_data)
        
        # Firestore Persistence Sync
        from app.core.firestore import firestore_service
        firestore_service.save_job(job_data)

        return job_data

    def update_job(
        self,
        job_id: str,
        status: Optional[str] = None,
        progress: Optional[float] = None,
        message: Optional[str] = None,
        result_url: Optional[str] = None,
        download_filename: Optional[str] = None,
        error_detail: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if job_id not in self._jobs:
            # Check Firestore if missing in memory
            from app.core.firestore import firestore_service
            db_job = firestore_service.get_job(job_id)
            if db_job:
                self._jobs[job_id] = db_job
            else:
                return None

        job = self._jobs[job_id]
        if status:
            job["status"] = status
        if progress is not None:
            job["progress"] = min(100.0, max(0.0, progress))
        if message:
            job["message"] = message
        if result_url:
            job["result_url"] = result_url
        if download_filename:
            job["download_filename"] = download_filename
        if error_detail:
            job["error_detail"] = error_detail

        job["updated_at"] = time.time()
        self.notify_subscribers(job)

        # Firestore Persistence Sync
        from app.core.firestore import firestore_service
        firestore_service.save_job(job)

        return job

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        if job_id in self._jobs:
            return self._jobs[job_id]
        from app.core.firestore import firestore_service
        return firestore_service.get_job(job_id)

    def list_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        from app.core.firestore import firestore_service
        if firestore_service.is_available:
            db_jobs = firestore_service.list_jobs(limit)
            if db_jobs:
                return db_jobs
        sorted_jobs = sorted(self._jobs.values(), key=lambda x: x["updated_at"], reverse=True)
        return sorted_jobs[:limit]

    def retry_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        if job_id in self._jobs:
            return self.update_job(job_id, status="Retry", progress=0.0, message="Menyiapkan pengulangan job...")
        return None

    def notify_subscribers(self, job_data: Dict[str, Any]):
        for q in self._subscribers:
            try:
                q.put_nowait(job_data)
            except Exception:
                pass

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

job_queue_service = JobQueueService()
