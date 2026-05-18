# Doğukan'ın Dünyası

İlkokula başlayan çocuklar için oyunlaştırılmış öğrenme sitesi. Okuma-yazma, sayılar, şekiller, bilim ve mantık aktiviteleri içerir.

## Geliştirme

```bash
npm install
npm run dev
```

Yerel adres: http://localhost:3000

## GitHub Pages

1. GitHub’da [serkanok1983/dogukan](https://github.com/serkanok1983/dogukan) reposuna `main` dalını push edin.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions** seçin.
3. İlk deploy sonrası site: `https://serkanok1983.github.io/dogukan/`

Uzak repo için HTTPS kullanın (`git@github.com` SSH anahtarı gerektirir):

```bash
git remote set-url origin https://github.com/serkanok1983/dogukan.git
```

Giriş: kullanıcı adı `dogukan`, şifre `ilovemyfather`.

## Yapı

- Next.js (App Router) + statik export
- `src/activities/` — oyun ve quiz bileşenleri
- `src/lib/menu.ts` — menü ve aktivite listesi
