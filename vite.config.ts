import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { formatEnvValidationProblems, validateRequiredEnv } from './scripts/validateEnv'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const basePath = env.VITE_BASE_PATH || '/'

  // Provide a stable default so %VITE_ENABLE_GH_PAGES_SPA_REDIRECT% in index.html is always defined.
  process.env.VITE_ENABLE_GH_PAGES_SPA_REDIRECT =
    process.env.VITE_ENABLE_GH_PAGES_SPA_REDIRECT ||
    env.VITE_ENABLE_GH_PAGES_SPA_REDIRECT ||
    'false'

  // Fail production builds early when required environment variables are
  // missing or invalid, listing every problem so the deployment can be fixed.
  // Set SKIP_ENV_VALIDATION=true (as a real environment variable) to bypass
  // this check for non-deployment builds, for example the CI test build.
  if (command === 'build' && process.env.SKIP_ENV_VALIDATION !== 'true') {
    const { problems } = validateRequiredEnv(env)
    if (problems.length > 0) {
      throw new Error(formatEnvValidationProblems(problems))
    }
  }

  return {
    base: basePath,
    plugins: [vue(), vueDevTools(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },
  }
})
