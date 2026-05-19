# Firebase Realtime Database — çapraz cihaz skorlar

## 1. Firebase projesi

1. [Firebase Console](https://console.firebase.google.com) → **Proje oluştur** (ör. `dogukan-nin-yeri`)
2. **Build → Realtime Database** → Veritabanı oluştur (bölge: `europe-west1` önerilir)
3. **Project settings → General → Your apps** → Web uygulaması ekle → config değerlerini kopyala

## 2. Kurallar (Rules)

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      "$game": {
        "$user": {
          ".write": true,
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 99999999"
        }
      }
    }
  }
}
```

> Aile içi kullanım için basit kurallar yeterli. Herkese açık site için Authentication eklemeniz gerekir.

## 3. Yerel geliştirme

`.env.local` oluşturun (`.env.example` şablonu):

```bash
cp .env.example .env.local
# değerleri doldurun
npm run dev
```

## 4. GitHub Pages deploy

Repository **Settings → Secrets and variables → Actions** altına şu secret'ları ekleyin:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

`main` branch'e push sonrası skorlar `leaderboard/{oyun}/{dogukan|serkan}` yolunda senkron olur.

## Veri yapısı

```
leaderboard/
  tetris/
    dogukan: 1200
    serkan: 980
  pong/
    dogukan: 15
    serkan: 20
```

Firebase yapılandırılmazsa skorlar yalnızca tarayıcıda (`localStorage`) saklanır.
