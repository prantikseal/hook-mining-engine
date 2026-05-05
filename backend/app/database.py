import logging
import time
from functools import wraps

from supabase import create_client, Client

from app.config import settings

logger = logging.getLogger(__name__)


def get_supabase() -> Client:
    """Create a fresh Supabase client each call to avoid stale HTTP/2 connections."""
    return create_client(settings.supabase_url, settings.supabase_key)


def with_retry(max_retries: int = 2, delay: float = 0.5):
    """Decorator to retry Supabase operations on connection errors."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    err_msg = str(e).lower()
                    if "disconnected" in err_msg or "remoteprotocol" in err_msg or "connection" in err_msg:
                        last_exc = e
                        if attempt < max_retries:
                            logger.warning(f"Supabase connection error (attempt {attempt + 1}), retrying: {e}")
                            time.sleep(delay)
                            continue
                    raise
            raise last_exc
        return wrapper
    return decorator
