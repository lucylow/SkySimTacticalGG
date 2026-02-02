# app/celery_app.py
from celery import Celery
import os

CELERY_BROKER = os.getenv("CELERY_BROKER", "redis://redis:6379/0")
CELERY_BACKEND = os.getenv("CELERY_BACKEND", "redis://redis:6379/1")

celery = Celery("agents_app", broker=CELERY_BROKER, backend=CELERY_BACKEND)

# Basic recommended settings (tune for your environment)
celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_soft_time_limit=60,
    task_time_limit=120,
    worker_prefetch_multiplier=1,
)


