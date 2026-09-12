import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // The public demo is shared by other users.
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
