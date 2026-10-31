# Yayın kontrol listesi (elle)

GitHub Actions dakikaları dolu olduğu için CI yok (MASTER_PLAN §4.8, K30).
Kapı `npm run check`, yayın `npm run deploy` ile yerelde yapılır. GitHub Pages
`gh-pages` dalından yayınlar; betik o dala yetim bir commit iter.

## Yayından önce

- [ ] `main` dalındasın ve çalışma ağacı temiz (`git status`).
- [ ] `.env.local` dolu: 7 `NEXT_PUBLIC_FIREBASE_*` + `NEXT_PUBLIC_PARENT_PIN_HASH`
      + `NEXT_PUBLIC_PIN_SALT` (`.env.example`). Eksikler yalnızca uyarıdır.
- [ ] Node 22 (`nvm use`), bağımlılıklar kurulu (`npm ci`).
- [ ] İstersen önce deneme: `npm run deploy -- --dry-run`
      (kapıyı çalıştırır, `out/`'u hazırlar, yayınlanacak dosyaları listeler, itmez).

## Yayın

```sh
npm run deploy
```

Betik sırasıyla şunları yapar ve herhangi biri başarısızsa durur:

1. temiz ağaç + `main` denetimi (`--allow-branch` ile bilerek aşılabilir),
2. `npm run check`: lint (0 uyarı) → `tsc` → `vitest` → `build:pages` →
   `sw-manifest` → `verify-out`,
3. `out/sw.js` içindeki `__BUILD_ID__` → kısa commit SHA'sı, `out/.nojekyll`,
4. `out/` → geçici worktree'de yetim commit `deploy: <tam SHA>` → `gh-pages`,
   `git push --force origin gh-pages`,
5. `gh` kuruluysa Pages derleme durumunu yazar.

## Yayından sonra (telefonda)

- [ ] <https://serkanok1983.github.io/dogukan/> açılıyor; avatar ekranı görünüyor.
- [ ] Geliştirici araçları (ya da `chrome://inspect`): `manifest.webmanifest`
      yükleniyor, `start_url` ve `scope` = `/dogukan/`, ikonlar görünüyor.
- [ ] *Application → Service Workers*: `sw.js` etkin, sürüm = kısa SHA.
- [ ] Uygulama zaten telefonda açıksa: haritaya dönünce **"Yeni oyunlar hazır —
      dokun ✨"** bildirimi çıkıyor; dokununca sayfa bir kez yenileniyor.
      (Oyun ortasında çıkmaz.)
- [ ] Uçak modu: daha önce açılan bir oyun açılıyor; hiç açılmamış bir oyun
      "Bu oyun için bir kez internete bağlan 📶" kartını gösteriyor.
- [ ] iPhone: Paylaş → Ana Ekrana Ekle; ikon (apple-touch-icon) doğru, tam ekran açılıyor.
- [ ] Bir oyun aç → kapat: `/bilgi` → Sağlık kartında yeni hata yok.

## Sorun olursa

- **Pages "errored":** `gh api repos/serkanok1983/dogukan/pages/builds/latest`
  çıktısındaki hataya bak. Önceki sürüme dönmek için o commit'i çek
  (`git checkout <eski-sha>`), `npm run deploy -- --allow-branch`.
- **Eski sürüm takılı kaldı:** service worker her açılışta ve uygulama öne
  geldiğinde güncelleme arar (`updateViaCache: "none"`). Gerekirse tarayıcı
  ayarlarından site verisini temizle.
- **`check` kırmızı:** hangi adımın patladığını betik yazar; o adımı tek başına
  çalıştır (`npx eslint`, `npx tsc --noEmit`, `npm test`, `npm run build:pages`,
  `npm run verify-out`).

## Uçtan uca duman testi (isteğe bağlı, engelleyici değil)

```sh
npm run build:pages && npm run e2e   # @playwright/test kurulu olmalı
```
