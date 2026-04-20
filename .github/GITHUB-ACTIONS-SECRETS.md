# GitHub Actions secrets (CI and Deploy)

Configure these in **GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Required | Description |
|--------|----------|-------------|
| `GCP_SA_KEY` | **Yes** for backend deploy | Full JSON of a Google Cloud **service account key** with roles such as **App Engine Admin** (and **Service Account User** if needed). Paste the entire JSON as the secret value. |
| `GCP_PROJECT_ID` | **Yes** for backend deploy | Your GCP project ID (e.g. `my-fitlife-prod`). |
| `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL` | No | In **Cloudflare Dashboard → Workers & Pages → your project → Settings → Deploy hooks**, create a **Production** hook and paste the full hook URL. If omitted, the workflow skips the Pages step without failing. |

## App Engine runtime configuration

Database URI and CORS are **not** set by this workflow (to avoid fragile escaping of MongoDB URIs in shell). Set them once in **Google Cloud Console → App Engine → Settings → Environment variables**, or deploy manually with `gcloud app deploy --set-env-vars=...`.

## Cloudflare note

If the frontend is already connected to GitHub, every push also builds Pages independently. The **deploy hook** is useful to rebuild the frontend **after** the API deploys (e.g. to pick up coordinated releases) or if you want a single pipeline to trigger both.
