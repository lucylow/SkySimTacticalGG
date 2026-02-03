# app/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/grid_ingest"
    REDIS_URL: str = "redis://redis:6379/0"
    GRID_API_KEY: str = "REPLACE_WITH_KEY"
    GRID_WS_URL: str = "wss://grid.example/stream"
    GRID_REST_BASE: str = "https://api.grid.example"
    RAW_EVENTS_TABLE: str = "events_raw"
    CANONICAL_STREAM: str = "events:canonical"
    INGESTOR_NAME: str = "grid_ingest_01"

    # WebSocket robustness
    WS_PING_INTERVAL: float = 20.0
    WS_PING_TIMEOUT: float = 20.0
    WS_MAX_SIZE: int | None = 4_194_304  # 4 MB, None means unlimited
    MAX_EVENT_BYTES: int = 8_388_608  # 8 MB safeguard for JSON payloads

    # HTTP client defaults
    HTTP_TIMEOUT: float = 30.0
    HTTP_MAX_RETRIES: int = 5
    HTTP_BACKOFF_BASE: float = 1.5

    # Open Source Esports API Keys
    RIOT_API_KEY: str = ""  # Get from https://developer.riotgames.com/
    OPENDOTA_API_KEY: str = ""  # Optional, for higher rate limits
    PANDASCORE_API_KEY: str = ""  # Optional, for Pandascore free tier

    # Open Source polling configuration
    OPENSOURCE_POLL_INTERVAL: int = 60  # seconds between polls
    OPENSOURCE_ENABLED: bool = True  # Enable/disable open source data sources

    # how many seconds to wait on reconnect jitter
    RECONNECT_BACKOFF: int = 5

    # HY-Motion 1.0 configuration
    # Path to HY-Motion 1.0 repository (cloned from https://github.com/Tencent-Hunyuan/HY-Motion-1.0)
    HY_MOTION_REPO_PATH: str = "/opt/HY-Motion-1.0"
    # Path to model weights (default: ckpts/tencent/HY-Motion-1.0 within repo)
    HY_MOTION_MODEL_PATH: str = ""
    # Local inference script path (default: local_infer.py within repo)
    HY_MOTION_INFER_SCRIPT: str = ""
    # Fallback: REST API endpoint (if running as a service)
    HY_MOTION_API_URL: str = ""
    HY_MOTION_API_KEY: str = ""
    # Legacy CLI path (for backward compatibility)
    HY_MOTION_CLI_PATH: str = ""

    # S3 configuration for motion artifacts
    S3_BUCKET: str = "agent-artifacts"
    S3_REGION: str = "us-east-1"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

