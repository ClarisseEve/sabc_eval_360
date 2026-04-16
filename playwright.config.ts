import { defineConfig } from '@playwright/test';

const apiPort = Number(process.env.E2E_API_PORT || 3300);
const webPort = Number(process.env.E2E_WEB_PORT || 4173);
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const webBaseUrl = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: webBaseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: `pnpm --dir apps/api build && PORT=${apiPort} CACHE_DRIVER=memory pnpm --dir apps/api start:prod`,
      url: `${apiBaseUrl}/api/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: `VITE_API_URL=${apiBaseUrl}/api pnpm --dir apps/web dev --host 127.0.0.1 --port ${webPort}`,
      url: webBaseUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 960 },
      },
    },
  ],
});
