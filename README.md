# Doğukan'ın Dünyası

İlkokula başlayan çocuklar için oyunlaştırılmış öğrenme sitesi. Okuma-yazma, sayılar, şekiller, bilim ve mantık aktiviteleri içerir.

## Geliştirme

```bash
npm install
npm run dev
```

Yerel adres: http://localhost:3000

## GitHub Pages

1. GitHub’da `dogukan-icin` adında bir repo oluşturun (veya `serkanok1983.github.io` altında bu klasör).
2. Bu projeyi `main` dalına push edin.
3. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions** seçin.
4. İlk push sonrası site: `https://serkanok1983.github.io/dogukan-icin/`

Giriş: kullanıcı adı `dogukan`, şifre `ilovemyfather`.

## Yapı

- Next.js (App Router) + statik export
- `src/activities/` — oyun ve quiz bileşenleri
- `src/lib/menu.ts` — menü ve aktivite listesi
