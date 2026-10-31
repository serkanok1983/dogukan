# Doğukan'ın Yeri

Doğukan için oyunlaştırılmış hazırlık etkinlikleri ve yaşına uygun bir **Merak
Ansiklopedisi**.

Ansiklopedinin ilk cildi yedi keşif dünyasında 14 temel bilim konusu sunar:
vücudumuz, canlılar, Dünya, uzay, madde–ışık, kuvvet–hareket ve
matematik–örüntüler. Her maddede
katmanlı Türkçe anlatım, sesli okuma, dokunarak mini laboratuvar, güvenli ev
gözlemi, bilim sözlüğü ve yanlış cevapları da açıklayan kısa bir değerlendirme
bulunur. İlerleme ve favoriler yalnızca kullanılan cihazda saklanır.

Mevcut okuma-yazma, sayılar, şekiller, mantık ve oyun bölümleri korunmuştur.

```bash
npm run dev
npm run lint
npm run build
```

Serkan ❤️ Doğukan

## Geliştirme

Node 22 (`.nvmrc`). CI yok; kapı ve yayın yerelde yapılır.

| Komut               | Ne yapar                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | geliştirme sunucusu                                                                                            |
| `npm test`          | Vitest birim ve bütünlük testleri                                                                              |
| `npm run check`     | tek kalite kapısı: lint (0 uyarı) → `tsc` → `vitest` → `build:pages` → `verify-out` (`-- --quick`: derlemesiz) |
| `npm run deploy`    | `check` + `out/`'u `gh-pages` dalına iter (`-- --dry-run`: itmeden listeler); bkz. `docs/RELEASE.md`           |
| `npm run serve-out` | `out/`'u `http://localhost:4173/dogukan/` adresinde sunar                                                      |
| `npm run e2e`       | Playwright duman testi (isteğe bağlı, engelleyici değil)                                                       |

Gizli değerler `.env.local`'a yazılır (örnek: `.env.example`; hepsi isteğe
bağlı). Firebase konsol adımları: `docs/ROLLOUT.md`.

## Geliştirme planı

Yeniden tasarım çalışması sürüyor. Kaldığımız yer, alınan kararlar ve sıradaki
adımlar için `docs/HANDOFF.md`; analiz ve öneri belgeleri için `docs/plan/`.
