/**
 * Çocuğun ilk açılış akışı (390×844): giriş → ayıya isim → harita → ada →
 * egzersiz → kapsül → oyun. Konsol hatası olmamalı. Ekran görüntüleri
 * `test-results/flow/` altına yazılır (elle gözden geçirmek için).
 */
import { expect, test, type Page } from "@playwright/test";

const shots = "test-results/flow";

// "Nefes alan" Başla düğmeleri sonsuz animasyonludur; azaltılmış hareket hem
// tıklamayı kararlı kılar hem de o yolu test eder.
test.use({ reducedMotion: "reduce" });

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|firebase/i.test(m.text()))
      errors.push(`console: ${m.text()}`);
  });
  return errors;
}

test("ilk açılış: giriş, isim, harita, ada, egzersiz, kapsül, oyun", async ({
  page,
}) => {
  const errors = watchErrors(page);
  // Gece ekranı (20:30–07:00) akışı kapatmasın: hafta içi sabah 10:00 (İstanbul).
  await page.clock.setFixedTime(new Date("2026-11-02T10:00:00+03:00"));

  await page.goto("./");
  await page.screenshot({ path: `${shots}/01-giris.png` });
  await page
    .getByRole("button", { name: /Doğukan/ })
    .first()
    .click();

  // İlk açılış: ayıya isim ver
  await expect(page.getByRole("button", { name: /Kaptan/ })).toBeVisible();
  await page.screenshot({ path: `${shots}/02-isim.png` });
  await page.getByRole("button", { name: /Kaptan/ }).click();

  // Harita
  await expect(page.getByText(/Macera Adası/).first()).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${shots}/03-harita.png`, fullPage: true });

  // Sayı Dağı → Sayma Oyunu (egzersiz)
  await page.goto("ada/sayi/");
  await expect(page.getByText(/Sayma/).first()).toBeVisible();
  await page.screenshot({ path: `${shots}/04-ada-sayi.png` });

  await page.goto("aktivite/sayma-oyunu/");
  await page.getByRole("button", { name: /Başla/ }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${shots}/05-egzersiz.png` });

  // Ses Avı
  await page.goto("aktivite/ses-avi/");
  await page.getByRole("button", { name: /Başla/ }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${shots}/06-ses-avi.png` });

  // Kapsül
  await page.goto("kesfet/isik-ve-golge/kapsul/");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${shots}/07-kapsul-baslangic.png` });
  await page.getByRole("button", { name: /Başla/ }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${shots}/08-kapsul-kart1.png` });

  // Süper Ayı
  await page.goto("aktivite/super-ayi/");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${shots}/09-super-ayi-start.png` });
  await page.getByRole("button", { name: /Başla/ }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${shots}/10-super-ayi-oyun.png` });

  // Blok Dünyası
  await page.goto("aktivite/blok-dunyasi/");
  await page.getByRole("button", { name: /Başla/ }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${shots}/11-blok.png` });

  // Ebeveyn paneli kapısı
  await page.goto("bilgi/");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${shots}/12-bilgi-kapi.png` });

  expect(errors).toEqual([]);
});
