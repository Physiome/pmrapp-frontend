import { defineConfig } from 'cypress'
import appConfig from './app.config.json'

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: `http://localhost:4173${appConfig.base}`,
  },
})
