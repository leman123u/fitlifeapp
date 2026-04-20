# FitLife Pro

Fitness tracking app: **React + Vite** frontend, **FastAPI** backend (MongoDB, Firebase Auth).

<!-- Replace YOUR_GITHUB_ORG and YOUR_REPO with your GitHub org/username and repository name -->

[![CI and Deploy](https://github.com/YOUR_GITHUB_ORG/YOUR_REPO/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/YOUR_GITHUB_ORG/YOUR_REPO/actions/workflows/ci.yml)

## Repos layout

| Path | Stack |
|------|--------|
| `/` | React 19, TypeScript, Tailwind, React Router, Recharts |
| `backend/` | FastAPI, Motor/PyMongo, Firebase Admin |

## Scripts (frontend)

```bash
npm install
npm run dev          # dev server
npm run lint
npm run test         # Vitest
npm run build        # output: build/
```

## Backend

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate  # Windows
pip install -r requirements.txt pytest
python -m pytest -q
```

## CI/CD (GitHub Actions)

On **push to `main`**, the workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. Runs **frontend** lint, tests, and production build  
2. Runs **backend** pytest  
3. Deploys **backend** to **Google App Engine** (`backend/app.yaml`)  
4. **POSTs** the Cloudflare Pages **deploy hook** (optional secret) to trigger a frontend rebuild  

Required secrets and setup: [`.github/GITHUB-ACTIONS-SECRETS.md`](.github/GITHUB-ACTIONS-SECRETS.md).

Frontend hosting: [`CLOUDFLARE-PAGES.md`](CLOUDFLARE-PAGES.md).  
Backend hosting: [`backend/DEPLOY.md`](backend/DEPLOY.md).

## Environment variables

Copy [`.env.example`](.env.example) to `.env` for local development (`VITE_*` variables).
