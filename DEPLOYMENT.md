# PMR Frontend Deployment Guide

This document covers deployment to production environments other than GitHub Pages, such as AWS, VM-based Nginx, or other static hosting providers.

## Scope

- This app is a static Vue/Vite build output (`dist/`).
- Production target is a root domain with `VITE_BASE_PATH=/`.
- GitHub Pages-specific fallback behaviour is optional and controlled by the `VITE_ENABLE_GH_PAGES_SPA_REDIRECT` environment variable.

## Prerequisites

- Node.js: `>=22.12.0` (see [package.json](package.json)).
- [Bun](https://bun.sh/) `>=1.3.3` (used for install/build commands in this repository).
- Environment variables configured for your production API/auth endpoints:
  - `VITE_API_BASE_URL`;
  - `VITE_DOWNLOAD_API`;
  - `VITE_GITHUB_CLIENT_ID`;
  - `VITE_GITHUB_AUTH_API`;
  - `VITE_GA_MEASUREMENT_ID`;
  - `VITE_BASE_PATH`; and
  - `VITE_ENABLE_GH_PAGES_SPA_REDIRECT`.

## Build-Time Environment Variables

Set these environment variables in your CI/CD configuration or shell before running `bun run build`. See [`.env.example`](.env.example) for the full local-development template and its placeholder values. Vite embeds these values in the generated client bundle, so <ins>**do not**</ins> use them for secrets.

> **Note:** `VITE_API_BASE_URL_PROXY` (shown in [`.env.example`](.env.example)) is a CI-only variable. The app never reads it — it is a GitHub repository variable used by the e2e workflow ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) to supply `VITE_API_BASE_URL` for tests. It does not need to be set for production deployments.

### Required for a Full Production Deployment

- `VITE_API_BASE_URL`: Base URL of the PMR backend API used for search, exposures, and workspaces. Example: `https://pmr3.demo.physiomeproject.org/`.
- `VITE_DOWNLOAD_API`: Base URL of the service that provides COMBINE and workspace archive downloads. _(This will be removed after all download APIs are available on PMR3.)_
- `VITE_GITHUB_CLIENT_ID`: Public client ID of the GitHub OAuth application used for sign-in. Example: `Ov23liExampleClientId`.
- `VITE_GITHUB_AUTH_API`: Base URL of the backend endpoint that completes GitHub OAuth authentication. _(This is used for GitHub login.)_ Example: `https://auth.[example-pmrapp-dev].com`.

The API and download URLs are required for their respective features, and the GitHub OAuth values are required for GitHub login option. `vite build` fails if any required variable is missing or invalid.

### Optional or Deployment-Specific Variables

- `VITE_GA_MEASUREMENT_ID`: Google Analytics 4 measurement ID. Set it to a value such as `G-ABC123DEFG` to enable analytics; leave it unset to disable analytics.
- `VITE_BASE_PATH`: Deployment path used for generated asset and router URLs. Use `/` for a root-domain deployment. It defaults to `/` when omitted. GitHub Pages project deployments instead use a repository path, such as `/pmrapp-frontend/`.
- `VITE_ENABLE_GH_PAGES_SPA_REDIRECT`: Enables the GitHub Pages query-string redirect helper. It defaults to `false`. Set it to `true` only for GitHub Pages project deployments; use `false` for Nginx, S3/CloudFront, and other standard hosts with SPA rewrite rules.

For example, a standard root-domain production environment can use:

```dotenv
VITE_API_BASE_URL=https://api.pmrapp.com
VITE_DOWNLOAD_API=https://downloads.pmrapp.com
VITE_GITHUB_CLIENT_ID=Ov23liExampleClientId
VITE_GITHUB_AUTH_API=https://auth.pmrapp.com
VITE_GA_MEASUREMENT_ID=G-ABC123DEFG
VITE_BASE_PATH=/
VITE_ENABLE_GH_PAGES_SPA_REDIRECT=false
```

## Production Build

```sh
bun install
bun run build
```

Build output is generated in `dist/`.

## Important Routing Behaviour (SPA)

The app is a single-page application: the build output (`dist/`) only contains `index.html`, the compiled assets, and the files copied from `public/`. There are **no** physical files or folders on the server for application routes such as:

- `/exposures` — the exposures listing page
- `/exposures/4e4` — a specific exposure's detail page
- `/workspaces/baylor_hollingworth_chandler_2002` — a specific workspace's detail page

Once the browser has loaded `index.html`, the Vue Router (see [src/router/index.ts](src/router/index.ts)) decides which page to render. But if a user opens one of these URLs directly or refreshes the page, the server receives a request for a path that doesn't exist on disk and would normally respond with 404.

**Therefore the hosting platform must return `index.html` for any request that doesn't match a real file** — commonly known as an "SPA fallback" (or "history-mode rewrite"). Worked examples for Nginx, CloudFront, and other hosts are given in the [Deployment Patterns](#deployment-patterns) section.

Without this fallback, refreshing a deep link such as `/exposures/4e4` returns 404.

## Deployment Patterns

### Option 1: Nginx on VM/Bare Metal (`/var/www` style)

1. Build in CI or on server:

```sh
bun install
bun run build
```

2. Copy `dist/` contents to your web root, for example:

```sh
sudo mkdir -p /var/www/pmrapp
sudo rsync -av --delete dist/ /var/www/pmrapp/
```

3. Use an Nginx server block similar to:

```nginx
server {
  listen 80;
  server_name www.pmrapp.com pmrapp.com;

  root /var/www/pmrapp;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

4. Reload Nginx.

```sh
sudo systemctl reload nginx   # or: sudo nginx -s reload
```

### Option 2: AWS S3 + CloudFront

1. Build with production variables (`VITE_BASE_PATH=/` and `VITE_ENABLE_GH_PAGES_SPA_REDIRECT=false`).
2. Upload `dist/` contents to S3 bucket origin.
3. Configure CloudFront custom error response to serve `/index.html` for 403/404 (SPA fallback).
4. Attach your domain (for example `www.pmrapp.com`) and TLS certificate.

### Option 3: Other Static Hosts

Any host is acceptable if it supports:

- Serving static files from `dist/`.
- Rewriting unknown application routes to `index.html`.
- Supplying environment variables at build time.

## Suggested CI Build Steps (Non-GitHub Pages)

```sh
bun install --frozen-lockfile
bun run build
```

Then publish the `dist/` artefact using your platform's deployment mechanism.

## GitHub Actions Template for Production

A non-GitHub Pages workflow template is available at [.github/workflows/deploy-production-template.yml](.github/workflows/deploy-production-template.yml).

Behaviour:

- On push to `production`, it performs a production build and uploads `dist/` as an artefact.
- On manual run (`workflow_dispatch`), it can also run a deployment placeholder job when `run_deploy=true`.

Defaults in this template are aligned with standard production hosting:

- `VITE_BASE_PATH=/`
- `VITE_ENABLE_GH_PAGES_SPA_REDIRECT=false`

Before using it for live deployment, replace the placeholder step with your provider commands, for example:

- AWS: `aws s3 sync dist/ s3://<bucket> --delete` and CloudFront invalidation.
- VM/Nginx: `rsync` the `dist/` artefact to your web root (for example `/var/www/pmrapp`).

## Environment Profiles

- GitHub Pages:
  - `VITE_BASE_PATH=/pmrapp-frontend/` (or another repository path)
  - `VITE_ENABLE_GH_PAGES_SPA_REDIRECT=true`
- Standard production:
  - `VITE_BASE_PATH=/`
  - `VITE_ENABLE_GH_PAGES_SPA_REDIRECT=false`

## Validation Checklist

- Build succeeds with Bun.
- `bun run build` fails with a clear message when a required variable is missing or invalid (verify by unsetting one and rebuilding).
- `/` loads correctly on the production domain.
- Deep-link refresh works (e.g., `/workspaces/...` doesn't return 404).
- API requests resolve to production backend URLs.
- OAuth callback and login flow work.
- Optional analytics loads, when configured.
