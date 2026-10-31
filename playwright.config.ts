/**
 * Playwright duman testi (S8, MASTER_PLAN §4.7). Engelleyici değildir ve
 * `npm run check`'e dahil değildir. Önce `npm run build:pages`, sonra `npm run e2e`.
 * Tarayıcı: varsayılan olarak kurulu Google Chrome (`channel: "chrome"`), böylece
 * Playwright tarayıcı indirmez. Paketli Chromium için: `E2E_CHANNEL= npm run e2e`.
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}/dogukan/`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "telefon",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
        locale: "tr-TR",
        channel: process.env.E2E_CHANNEL ?? "chrome",
      },
    },
  ],
  webServer: {
    command: `node scripts/serve-out.mjs --port ${PORT}`,
    url: `http://localhost:${PORT}/dogukan/`,
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
