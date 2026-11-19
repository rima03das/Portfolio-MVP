import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const e2ePort = 8081

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm start',
    cwd: rootDir,
    url: `http://127.0.0.1:${e2ePort}/api/setup/status`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      PORT: String(e2ePort),
      PORTFOLIO_DB_URL: 'jdbc:h2:mem:portfolio-e2e;DB_CLOSE_DELAY=-1',
      PORTFOLIO_RESET: 'true',
    },
  },
})
