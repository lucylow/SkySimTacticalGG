# Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    POETRY_VIRTUALENVS_CREATE=false

# System deps (add any extra libs your motion tooling needs, e.g., ffmpeg)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      gcc \
      git \
      curl \
      ca-certificates \
      libffi-dev \
      libssl-dev \
      libsqlite3-dev \
      wget \
      && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only requirements first for layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt

# Copy the app
COPY . /app

# Create an unprivileged user
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Default command runs FastAPI (uvicorn)
CMD ["uvicorn", "app.api:app", "--host", "0.0.0.0", "--port", "8000"]
