# Deploy FitLife Pro (React + Vite) to Cloudflare Pages (GitHub)

This app is a **single-page application** (React Router). Cloudflare Pages must serve `index.html` for deep links; that is handled by `public/_redirects`, which Vite copies into the build output.

## Build settings (Cloudflare dashboard)

When you create or edit the Pages project, use:

| Setting | Value |
|--------|--------|
| **Framework preset** | None (or Vite — either is fine if commands match) |
| **Build command** | `npm run build` |
| **Build output directory** | `build` |
| **Root directory** | `/` (repository root). If the app lives in a subfolder, set that folder instead. |

### Node.js version

In **Settings → Environment variables** (or **Builds**), add:

| Variable name | Value (example) |
|---------------|------------------|
| `NODE_VERSION` | `20` or `22` |

This keeps local and CI builds on a supported Node version.

---

## Environment variables (Cloudflare dashboard)

Vite only exposes variables prefixed with **`VITE_`**. They are **embedded at build time**, so set them for **Production** (and **Preview** if you want PR previews to work against a staging API).

Add these in **Workers & Pages** → your project → **Settings** → **Environment variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | Public URL of your FastAPI backend (e.g. `https://YOUR-PROJECT.uc.r.appspot.com` — no trailing slash) |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Console → Project settings → Your apps → Web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Usually `your-project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Optional | If shown in your Firebase web config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | e.g. `project-id.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Sender ID from the web app config |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional | `G-…` — enables Firebase Analytics (GA4) in the client |

**Security:** These values are shipped to the browser. Do not put server secrets here. Firebase API keys for web apps are designed to be public; restrict usage with Firebase App Check / authorized domains as needed.

### CORS on your API

Your FastAPI backend must allow your Cloudflare Pages origin in `CORS_ORIGINS`, for example:

`https://fitlife-pro.pages.dev` and your custom domain after you add it.

---

## `_redirects` and React Router

The file `public/_redirects` contains:

```txt
/*    /index.html   200
```

Vite copies everything under `public/` to the root of the build output (`build/`), so Cloudflare Pages applies this rule and client-side routes keep working on refresh.

---

## Connect GitHub to Cloudflare Pages (step by step)

1. **Push your repo to GitHub**  
   Ensure the FitLife Pro app (with `package.json` at the path you will use as root) is on GitHub.

2. **Log in to Cloudflare**  
   Go to [dash.cloudflare.com](https://dash.cloudflare.com) and select **Workers & Pages**.

3. **Create a Pages project**  
   - Click **Create** → **Pages** → **Connect to Git**.  
   - Authorize Cloudflare to access GitHub if prompted.  
   - Select the **repository** and click **Begin setup**.

4. **Configure the build**  
   - **Project name**: e.g. `fitlife-pro`.  
   - **Production branch**: e.g. `main` or `master`.  
   - **Build settings** (see table above):  
     - Build command: `npm run build`  
     - Build output directory: `build`  
   - **Root directory**: leave empty or `/` if `package.json` is at the repo root.

5. **Environment variables**  
   - Expand **Environment variables (advanced)** or add them after creation under **Settings**.  
   - Add every `VITE_*` variable listed above for **Production**.  
   - Add `NODE_VERSION` = `20` (or `22`).

6. **Save and deploy**  
   Click **Save and Deploy**. The first build runs automatically; later pushes to the production branch trigger new deploys.

7. **Verify**  
   Open the `*.pages.dev` URL. Test a client route (e.g. `/workouts`) and refresh the page — it should load without 404.

8. **Custom domain (optional)**  
   In the Pages project → **Custom domains** → add your domain and follow DNS instructions.

---

## Local build check

```bash
npm ci
npm run build
```

Confirm the `build/` folder contains `index.html`, assets, and `_redirects`.

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| 404 on refresh for `/login`, `/workouts`, etc. | `_redirects` is in `public/`, rebuilt, and present in `build/` root; redeploy. |
| API calls fail or hit localhost | `VITE_API_URL` set for **Production** in Cloudflare; rebuild after changing env vars. |
| Firebase errors | All required `VITE_FIREBASE_*` vars set; Firebase **Authorized domains** include your `*.pages.dev` and custom domain. |
| Build fails on Pages | `NODE_VERSION` matches a supported release; run `npm run build` locally with the same Node version. |
