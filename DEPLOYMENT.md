# PMR Frontend Deployment Guide

This document covers deployment to production environments other than GitHub Pages, such as AWS, VM-based Nginx, or other static hosting providers.

## Scope

- This app is a static Vue/Vite build output (`dist/`).
- Production target is a root domain with `VITE_BASE_PATH=/`.
- GitHub Pages-specific fallback behaviour is optional and controlled by environment variable.

## Prerequisites

- Node.js: `>=22.12.0` (see [package.json](package.json)).
- [Bun](https://bun.sh/) `>=1.3.3` (used for install/build commands in this repository).
- Environment variables configured for your production API/auth endpoints.

## Build-Time Environment Variables

Set these in your CI/CD configuration or shell before running `bun run build`. See [`.env.example`](.env.example) for the full local-development template and its placeholder values. Vite embeds these values in the generated client bundle, so do not use them for secrets.

### Required for a Full Production Deployment

- `VITE_API_BASE_URL`: Base URL of the PMR backend API used for search, exposures, and workspaces. Example: `https://pmr3.demo.physiomeproject.org/`.
- `VITE_DOWNLOAD_API`: Base URL of the service that provides COMBINE and workspace archive downloads. _(This will be removed after all download APIs are available on PMR3.)_
- `VITE_GITHUB_CLIENT_ID`: Public client ID of the GitHub OAuth application used for sign-in. Example: `Ov23liExampleClientId`.
- `VITE_GITHUB_AUTH_API`: Base URL of the backend endpoint that completes GitHub OAuth authentication. _(This is used for GitHub login.)_ Example: `https://auth.[example-pmrapp-dev].com`.

The API and download URLs are required for their respective application features. The GitHub OAuth values are required for GitHub sign-in; if they are unset, the GitHub login flow will fail (the UI currently always shows the GitHub login option).

### Optional or Deployment-Specific Variables

- `VITE_GA_MEASUREMENT_ID`: Optional Google Analytics 4 measurement ID. Set it to a value such as `G-ABC123DEFG` to enable analytics; leave it unset to disable analytics.
- `VITE_BASE_PATH`: Deployment path used for generated asset and router URLs. Use `/` for a root-domain deployment. It defaults to `/` when omitted. GitHub Pages project deployments instead use a repository path, such as `/pmrapp-frontend/`.
- `VITE_ENABLE_GH_PAGES_SPA_REDIRECT`: Enables the GitHub Pages query-string redirect helper. It is optional and defaults to `false`. Set it to `true` only for GitHub Pages project deployments; use `false` for Nginx, S3/CloudFront, and other standard hosts with SPA rewrite rules.

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

The app uses history mode routing (see [src/router/index.ts](src/router/index.ts)), so the hosting platform must return `index.html` for unknown routes.

Examples:

- `/exposures`
- `/workspaces/some-alias`

If your server does not rewrite these requests to `index.html`, refreshing a deep link will return 404.

## GitHub Pages Script Toggle

The query-string redirect helper in [index.html](index.html) is now guarded by:

- `VITE_ENABLE_GH_PAGES_SPA_REDIRECT=true` for GitHub Pages deployments.
- `VITE_ENABLE_GH_PAGES_SPA_REDIRECT=false` for standard production hosting.

For non-GitHub production deployments, the redirect script should stay disabled.

The file [public/404.html](public/404.html) is only needed for the GitHub Pages fallback approach and is not required for standard production hosts with proper SPA rewrite rules.

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

### Option 2: AWS S3 + CloudFront

1. Build with production variables (`VITE_BASE_PATH=/`, redirect toggle `false`).
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

Then publish the `dist/` artifact using your platform-specific deploy mechanism.

## GitHub Actions Template for Production

A non-GitHub Pages workflow template is available at [.github/workflows/deploy-production.yml](.github/workflows/deploy-production.yml).

Behaviour:

- On push to `production`, it performs a production build and uploads `dist/` as an artefact.
- On manual run (`workflow_dispatch`), it can also run a deployment placeholder job when `run_deploy=true`.

Defaults in this template are aligned with standard production hosting:

- `VITE_BASE_PATH='/'`
- `VITE_ENABLE_GH_PAGES_SPA_REDIRECT='false'`

Before using it for live deployment, replace the placeholder step with your provider commands, for example:

- AWS: `aws s3 sync dist/ s3://<bucket> --delete` and CloudFront invalidation.
- VM/Nginx: `rsync` the `dist/` artefact to your web root (for example `/var/www/pmrapp`).

## Environment Profiles

- GitHub Pages: `VITE_BASE_PATH=/pmrapp-frontend/` (or configured repository path).
- GitHub Pages: `VITE_ENABLE_GH_PAGES_SPA_REDIRECT=true`.
- Standard production: `VITE_BASE_PATH=/`.
- Standard production: `VITE_ENABLE_GH_PAGES_SPA_REDIRECT=false`.

## Validation Checklist

- Build succeeds with Bun.
- `/` loads correctly on production domain.
- Deep-link refresh works (for example `/workspaces/...` loads without 404).
- API requests resolve to production backend URLs.
- OAuth callback and login flow work.
- Optional analytics loads only when configured.
