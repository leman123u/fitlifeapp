# Backup / alternative: build and run locally, or deploy to Cloud Run / App Engine Flexible.
# Example local:
#   docker build -t fitlife-api .
#   docker run --rm -p 8080:8080 -e PORT=8080 -e MONGODB_URI=... -e CORS_ORIGINS=... fitlife-api

FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8080

# Same ASGI stack as app.yaml
CMD exec gunicorn -k uvicorn.workers.UvicornWorker -w 1 --threads 1 --timeout 120 \
    --bind 0.0.0.0:${PORT} app.main:app
