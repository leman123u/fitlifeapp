# Deploy FitLife Pro API to Google App Engine

This backend uses **Python 3.11** on **App Engine Standard** with **Gunicorn** + **Uvicorn** workers. Configuration lives in `app.yaml`.

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`) installed and logged in.
2. A GCP project with billing enabled.
3. [App Engine Admin API](https://console.cloud.google.com/apis/library/appengine.googleapis.com) enabled.
4. MongoDB reachable from the internet (e.g. MongoDB Atlas); allow connections from App Engine (Atlas: `0.0.0.0/0` for testing, or tighter IP rules for production).
5. Firebase Admin: on App Engine, **Application Default Credentials** usually work with the default App Engine service account; ensure that account can verify Firebase tokens (Firebase project settings / service accounts as needed).

## Environment variables

Set these for production (never commit secrets to git):

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `CORS_ORIGINS` | Recommended | Comma-separated allowed browser origins (e.g. `https://myapp.web.app,http://localhost:5173`) |
| `MONGODB_DB_NAME` | No | Defaults to `fitlife_pro` (also set in `app.yaml`) |
| `ENVIRONMENT` | No | `production` is set in `app.yaml` |
| `CLOUDFLARE_FRONTEND_URL` | No | Single extra CORS origin if you do not use `CORS_ORIGINS` |

Firebase file path `GOOGLE_APPLICATION_CREDENTIALS` is optional on GAE; prefer ADC.

## One-time setup

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud app create --region=us-central
```

Choose a [supported region](https://cloud.google.com/appengine/docs/locations) if you prefer another.

## Deploy

From the **`backend`** directory (where `app.yaml` and `requirements.txt` are):

```bash
cd backend
```

Deploy with environment variables (example):

```bash
gcloud app deploy app.yaml --set-env-vars="MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/?retryWrites=true&w=majority,CORS_ORIGINS=https://your-frontend.example.com"
```

Or set variables in [Google Cloud Console](https://console.cloud.google.com/appengine/settings) → **App Engine** → **Settings** → **Environment variables**, then:

```bash
gcloud app deploy app.yaml
```

View the service:

```bash
gcloud app browse
```

API base URL is typically `https://YOUR_PROJECT_ID.uc.r.appspot.com` (region may vary). Health check: `GET /health`.

## Logs

```bash
gcloud app logs tail -s default
```

## Dockerfile (backup)

Build and run locally or use with **Cloud Run** / **App Engine Flexible**:

```bash
docker build -t fitlife-api .
docker run --rm -p 8080:8080 \
  -e MONGODB_URI="your-uri" \
  -e CORS_ORIGINS="https://your-frontend.example.com" \
  fitlife-api
```

## Troubleshooting

- **502 / startup errors**: Check logs; confirm `MONGODB_URI` and network access to MongoDB.
- **CORS errors**: Set `CORS_ORIGINS` to your exact frontend origin (scheme + host + port).
- **Firebase auth failures**: Ensure Firebase Admin initializes (ADC or credentials) and project ID matches your Firebase project.
