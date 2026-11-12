import fs from 'node:fs';
import { defineConfig } from 'cypress';
import { loadEnv } from 'vite';

// Includes `VITE_*` variables from the shell (e.g. CI), which take priority over `.env`.
const viteEnv = loadEnv('', process.cwd(), 'VITE_');
const basePath = viteEnv.VITE_BASE_PATH || '/';

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: `http://localhost:4173${basePath}`,
    defaultBrowser: 'chrome',
    chromeWebSecurity: false,
    expose: {
      // The feature comparison spec stubs this URL with a fixture.
      featureComparisonCsvUrl: viteEnv.VITE_FEATURE_COMPARISON_SHEET_CSV_URL ?? '',
    },
    setupNodeEvents(on, config) {
      on('task', {
        clearDownloads() {
          const downloadsPath = config.downloadsFolder;
          if (fs.existsSync(downloadsPath)) {
            fs.rmSync(downloadsPath, { recursive: true, force: true });
          }
          return null;
        },
      });
    },
  },
});
