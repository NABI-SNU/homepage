import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

const e2eEnv = {
  AUTH_TRUSTED_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000',
  AUTH_USE_SECURE_COOKIES: 'false',
  BETTER_AUTH_URL: 'http://localhost:3000',
  E2E_DISABLE_CACHE: 'true',
  NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
  S3_STORAGE_ENABLED: 'false',
} as const

Object.assign(process.env, e2eEnv)
const mergedWebServerEnv = {
  ...process.env,
  ...e2eEnv,
}
const webServerEnv = Object.fromEntries(
  Object.entries(mergedWebServerEnv).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  ),
)

delete webServerEnv.FORCE_COLOR
delete webServerEnv.NO_COLOR

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  grepInvert: /@auth/,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',
    navigationTimeout: 120_000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: 'rm -rf .next/cache && pnpm dev',
    env: webServerEnv,
    reuseExistingServer: true,
    url: 'http://localhost:3000',
  },
})
