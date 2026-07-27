import { defineConfig } from 'cypress'
import { loadEnv } from 'vite'

const basePath = loadEnv('', process.cwd(), 'VITE_').VITE_BASE_PATH ?? '/'

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: `http://localhost:4173${basePath}`,
  },
})
