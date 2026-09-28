import { defineConfig } from 'cypress'
import { loadEnv } from 'vite'
import fs from 'fs'

const basePath = loadEnv('', process.cwd(), 'VITE_').VITE_BASE_PATH || '/'

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: `http://localhost:4173${basePath}`,
    defaultBrowser: 'chrome',
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      on('task', {
        clearDownloads() {
          const downloadsPath = config.downloadsFolder
          if (fs.existsSync(downloadsPath)) {
            fs.rmSync(downloadsPath, { recursive: true, force: true })
          }
          return null
        },
      })
    },
  },
})
