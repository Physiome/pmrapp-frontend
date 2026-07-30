import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const basePath = env.VITE_BASE_PATH || '/'

  // Provide a stable default so %VITE_ENABLE_GH_PAGES_SPA_REDIRECT% in index.html is always defined.
  process.env.VITE_ENABLE_GH_PAGES_SPA_REDIRECT =
    process.env.VITE_ENABLE_GH_PAGES_SPA_REDIRECT ||
    env.VITE_ENABLE_GH_PAGES_SPA_REDIRECT ||
    'false'

  return {
    base: basePath,
    plugins: [vue(), vueDevTools(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
