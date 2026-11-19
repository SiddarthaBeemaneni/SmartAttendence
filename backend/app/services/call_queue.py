"""
SmartAttend AI / CampusAI - Resilient Background Call Queue Worker

Executes background call jobs reliably:
- Does NOT require the faculty browser to stay open
- Idempotency checks to prevent duplicate simultaneous calls
- Attempt counting and bounded retry policies
- Database transaction safety
"""

import asyncio
import logging
import threading
import time
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor

from app.database import SessionLocal
from app.models.attendance import AICallLog
from app.services.calling_service import process_call_job

logger = logging.getLogger("smartattend.call_queue")

# Thread pool for asynchronous background call dispatch
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="CallWorker")
_active_jobs = set()
_lock = threading.Lock()


def _run_job_in_worker(call_log_id: str, simulated_reason: Optional[str] = None):
    """Worker task executed in background thread pool."""
    with _lock:
        if call_log_id in _active_jobs:
            logger.warning(f"Job {call_log_id} is already being processed. Skipping duplicate.")
            return
        _active_jobs.add(call_log_id)

    try:
        with SessionLocal() as db:
            # Run async call processor inside new event loop for this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(
                    process_call_job(db, call_log_id, simulated_reason=simulated_reason)
                )
            finally:
                loop.close()
    except Exception as e:
        logger.error(f"Error processing call job {call_log_id}: {e}", exc_info=True)
        # Update record failure in database
        try:
            with SessionLocal() as db:
                record = db.query(AICallLog).filter(AICallLog.id == call_log_id).first()
                if record:
                    record.call_status = "failed"
                    record.failure_reason = str(e)
                    db.commit()
        except Exception:
            pass
    finally:
        with _lock:
            _active_jobs.discard(call_log_id)


def enqueue_call_job(
    call_log_id: str,
    simulated_reason: Optional[str] = None,
    delay_seconds: float = 0.5,
) -> bool:
    """
    Submits a call job to the background execution pool.
    Returns True if successfully queued.
    """
    def delayed_dispatch():
        if delay_seconds > 0:
            time.sleep(delay_seconds)
        _run_job_in_worker(call_log_id, simulated_reason=simulated_reason)

    _executor.submit(delayed_dispatch)
    return True
