# Doğukan'ın Yeri

Doğukan için eğlenceli oyunlar ve oyunlaştırılmış öğrenme aktiviteleri. Okuma-yazma, sayılar, şekiller, bilim ve mantık aktiviteleri içerir.

## Geliştirme

```bash
npm install
npm run dev
```

Yerel adres: http://localhost:3000

## GitHub Pages

1. `main` dalına push edin (workflow `gh-pages` dalına statik site yükler).
2. Repo **Settings → Pages**:
   - **Build and deployment → Source:** *Deploy from a branch*
   - **Branch:** `gh-pages` / **Folder:** `/ (root)`
3. Site adresi: `https://serkanok1983.github.io/dogukan/`

İlk kez kuruyorsanız önce push yapın, `gh-pages` dalı oluşsun, sonra Pages ayarını yapın. Workflow’u yeniden çalıştırmak için **Actions → Deploy to GitHub Pages → Run workflow**.

Uzak repo için HTTPS kullanın (`git@github.com` SSH anahtarı gerektirir):

```bash
git remote set-url origin https://github.com/serkanok1983/dogukan.git
```

Giriş: kullanıcı adı `dogukan`, şifre `ilovemyfather`.

## Yapı

- Next.js (App Router) + statik export
- `src/activities/` — oyun ve quiz bileşenleri
- `src/lib/menu.ts` — menü ve aktivite listesi
