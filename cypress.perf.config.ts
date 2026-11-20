import { defineConfig } from 'cypress';
import { loadEnv } from 'vite';

const basePath = loadEnv('', process.cwd(), 'VITE_').VITE_BASE_PATH || '/';

// Configuration for the performance checks in cypress/perf.
// These are kept out of the regular e2e suite and print their measurements
// to the terminal with a "PERF>" prefix.
export default defineConfig({
  e2e: {
    specPattern: 'cypress/perf/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false,
    baseUrl: `http://localhost:4173${basePath}`,
    defaultBrowser: 'chrome',
    chromeWebSecurity: false,
    video: false,
    setupNodeEvents(on) {
      on('task', {
        log(message: string) {
          console.log(`PERF> ${message}`);
          return null;
        },
      });
    },
  },
});
