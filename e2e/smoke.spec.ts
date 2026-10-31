/**
 * Duman testi (390×844, out/ üzerinde). Engelleyici değil; `npm run e2e`.
 * Metinlere değil yapıya bakar; kabuk (S1) metinleri değişse de çalışsın.
 */
import { expect, test } from "@playwright/test";

test("ana sayfa: bildirim, apple-touch-icon ve içerik", async ({ page }) => {
  const response = await page.goto("./");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    /\/dogukan\/manifest\.webmanifest/,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator("body")).not.toBeEmpty();
});

test("bildirim gövdesi basePath önekli", async ({ request }) => {
  const res = await request.get("manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.start_url).toBe("/dogukan/");
  expect(manifest.scope).toBe("/dogukan/");
  for (const icon of manifest.icons) expect(icon.src).toMatch(/^\/dogukan\/icons\//);
});

test("bir oyun açılır ve dış bağlantı yoktur", async ({ page }) => {
  await page.goto("aktivite/super-ayi/");
  await expect(page.locator(".activity-page")).toBeVisible();
  await expect(page.locator('a[href^="http"], a[target]')).toHaveCount(0);
});

test("bilinmeyen sayfa Türkçe 404 gösterir", async ({ page }) => {
  const response = await page.goto("yok-boyle-bir-sayfa/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: /Haritaya dön/ })).toBeVisible();
});

test("service worker kaydolur ve çevrimdışı kabuk açılır", async ({
  page,
  context,
}) => {
  await page.goto("./");
  const scope = await page.evaluate(
    async () => (await navigator.serviceWorker.ready).scope,
  );
  expect(scope).toMatch(/\/dogukan\/$/);
  // SW'nin kurulumu (önbellek) bitsin diye bir kez yenile.
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("body")).not.toBeEmpty();
  // Hiç açılmamış bir oyun çevrimdışı kartını gösterir.
  await page.goto("aktivite/tetris/");
  await expect(page.getByText(/internete bağlan/)).toBeVisible();
  await context.setOffline(false);
});
