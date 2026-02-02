# Celery Configuration
import os

broker_url = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1")

task_serializer = "json"
accept_content = ["json"]
result_serializer = "json"
timezone = "UTC"
enable_utc = True

# Task routing
task_routes = {
    "app.tasks.enqueue_insight_workflow": {"queue": "insights"},
    "app.tasks.*": {"queue": "default"},
}

# Worker settings
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 50
task_acks_late = True

# Result expiration
result_expires = 3600  # 1 hour

# Monitoring
worker_send_task_events = True
task_send_sent_event = True


