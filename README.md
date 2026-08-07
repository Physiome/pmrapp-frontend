# PMR - Frontend [![Deploy static content to Pages](https://github.com/akhuoa/pmrapp-frontend/actions/workflows/deploy.yml/badge.svg)](https://github.com/akhuoa/pmrapp-frontend/actions/workflows/deploy.yml)

The next-generation frontend web application for the [Physiome Model Repository](https://models.physiomeproject.org/), built with Vue 3, TypeScript, and Tailwind CSS v4.

## About

A modern, responsive web application for browsing and exploring computational models in the Physiome Model Repository. Built with Vue 3 and powered by [a Rust-based backend](https://github.com/Physiome/pmrplatform), this project represents the next generation of the platform.

**Features:**
- 🎨 Light/Dark theme with system preference support
- 📱 Responsive design with Tailwind CSS v4
- ⚡ Built with Vue 3 Composition API and TypeScript
- 🧩 Atomic design component structure

## Tech Stack

- **Framework:** Vue 3 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Routing:** Vue Router
- **Testing:** Vitest (unit) + Cypress (e2e)
- **Code Quality:** Biome (formatting and linting) + TypeScript

## Project Structure

```
src/
├── assets/          # Global styles and CSS files
├── components/      # Vue components (atomic design)
│   ├── atoms/       # Basic building blocks
│   ├── molecules/   # Simple component groups
│   └── organisms/   # Complex components
├── composables/     # Vue composables
├── layouts/         # Layout components
├── router/          # Vue Router configuration
├── services/        # API service layer
├── types/           # TypeScript type definitions
└── views/           # Page-level components
```

## Getting Started

### Prerequisites

- Node.js 22.12+ (LTS recommended, for compatibility)
- [Bun](https://bun.sh/) 1.3.3 (latest recommended)

### Installation

```sh
bun install
```

### Environment Configuration

Copy the example environment file and configure as needed:

```sh
cp .env.example .env
```

**Environment Variables:**

- `VITE_API_BASE_URL` - Base URL for the PMR API server (default: `http://127.0.0.1:9380` for local Rust backend)
- `VITE_DOWNLOAD_API` - Base URL of the service used for COMBINE and workspace archive downloads. _(This will be removed after all download APIs are available on PMR3.)_
- `VITE_DOWNLOAD_HOST` - Optional base URL used for workspace archive links when the site and download API are hosted on different origins. If unset, the app uses the current host. Not required for same-origin production deployments.
- `VITE_GITHUB_CLIENT_ID` - Public client ID of the GitHub OAuth application used for sign-in.
- `VITE_GITHUB_AUTH_API` - Base URL of the backend endpoint that completes GitHub OAuth authentication.
- `VITE_GA_MEASUREMENT_ID` - Google Analytics 4 measurement ID. Leave unset to disable analytics.
- `VITE_BASE_PATH` - Deployment path used for generated asset and router URLs.
- `VITE_ENABLE_GH_PAGES_SPA_REDIRECT` - Enables GitHub Pages redirect helper when set to `true`.

> **Note:** To run the backend locally, see the [pmrplatform](https://github.com/Physiome/pmrplatform/) repository for setup instructions.

### Development

Start the development server with hot-reload:

```sh
bun run dev
```

The app will be available at `http://localhost:5173/pmrapp-frontend/`

### Build

Type-check, compile and minify for production:

```sh
bun run build
```

Preview the production build:

```sh
bun run preview
```

## Testing

### Unit Tests

Run unit tests with Vitest:

```sh
bun run test:unit
```

### End-to-End Tests

Run e2e tests in development mode:

```sh
bun run test:e2e:dev
```

Run e2e tests against production build:

```sh
bun run build
bun run test:e2e
```

## Code Quality

Format code:

```sh
bun run format
```

Lint and fix code:

```sh
bun run lint
```

Run both format and lint:

```sh
bun run format && bun run lint
```

## Development Tools

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension (disable Vetur if installed)

### Browser DevTools

**Chrome/Edge/Brave:**
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Enable Custom Object Formatters in DevTools settings

**Firefox:**
- [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## Related Projects

- **Backend:** [pmrplatform](https://github.com/Physiome/pmrplatform/) - Rust-powered backend platform
- **Rust Demo:** [pmr3.demo.physiomeproject.org](https://pmr3.demo.physiomeproject.org/) - Alternative frontend built with Leptos (Rust)
- **Current Production:** [models.physiomeproject.org](https://models.physiomeproject.org/) - Active Physiome Model Repository
