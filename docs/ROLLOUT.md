# Firebase devreye alma (konsol adımları)

Firebase **isteğe bağlıdır**. Yapılandırılmamışsa uygulama tamamen yerel
çalışır; her Firebase çağrısı tembel yüklenir ve sessizce başarısız olabilir
(CONTRACT §0.9, §16). Bu belge, mevcut açık veritabanını anonim kimlik
doğrulama + şekil kurallarıyla kapatmanın sırasını anlatır.

> **Önemli:** Anonim kimlik doğrulama "uygulamayı açan biri" demektir; API
> anahtarı pakette açıktır. Kurallar rastgele REST yazımlarını ve bozuk veriyi
> engeller, gerçek bir kullanıcı ayrımı yapmaz. Çocuğa ait kişisel veri
> yazılmaz (yalnızca skor, gün özeti, hata kaydı, paylaşılan blok küçük resmi).

## Yazılan yollar

| Yol                                | Yazan | İçerik                                                   |
| ---------------------------------- | ----- | -------------------------------------------------------- |
| `leaderboard/{slug}/{player}`      | S5    | sayı (en iyi skor)                                       |
| `activity/dogukan/{logins,visits}` | S6    | `{ at, iso }`, `{ at, iso, slug, title }`                |
| `users/{player}/days/{YYYY-MM-DD}` | S6    | `DayUsage` (`plays` ayrıntısı olmadan)                   |
| `users/{player}/gallery/{0-4}`     | S9    | `{ name, thumb, sharedAt }` (küçük resim ≤ 20 KB)        |
| `errors/{player}/{pushId}`         | S8    | `{ at, slug, message, ua, buildId }`                     |

Kuralların tamamı depodaki [`database.rules.json`](../database.rules.json)
dosyasındadır.

## Sıra (önemli)

Kurallar `auth != null` ister. Kurallar, anonim oturum açan sürüm yayına
çıkmadan yapıştırılırsa eski sürümlerin yazımları sessizce reddedilir (oyun
bozulmaz, yalnızca skor/özet yazılmaz).

1. **Anonymous Auth'u aç**
   Firebase Console → *Build → Authentication → Sign-in method* →
   **Anonymous** → *Enable* → *Save*.
2. **Yetkili alan adı**
   *Authentication → Settings → Authorized domains* listesine
   `serkanok1983.github.io` ekli olsun (`localhost` varsayılan olarak vardır).
3. **Uygulamayı yayınla**
   `.env.local` içinde 7 `NEXT_PUBLIC_FIREBASE_*` değişkeni dolu olsun
   (`.env.example`). Ardından `npm run deploy` (docs/RELEASE.md).
   `src/lib/firebase.ts` veritabanına ilk erişimde `signInAnonymously` çağırır.
4. **Doğrula (kurallar hâlâ eski)**
   Telefonda uygulamayı aç, bir oyun oyna. Console → *Authentication → Users*
   listesinde bir **anonim kullanıcı** görünmeli.
5. **Kuralları yapıştır**
   *Realtime Database → Rules* sekmesine `database.rules.json` içeriğini
   yapıştır → *Publish*.
   Komut satırıyla istenirse: `.firebaserc.example` → `.firebaserc` (proje
   kimliğini yaz), sonra `npx firebase-tools deploy --only database`.
6. **Kural oyun alanı (Rules Playground)** ile kontrol:
   - kimlik doğrulamasız `set /leaderboard/super-ayi/dogukan = 10` → **reddedilmeli**
   - anonim kimlikle aynı yazım → **izin verilmeli**
   - anonim kimlikle `set /leaderboard/super-ayi/dogukan = "abc"` → **reddedilmeli**
   - anonim kimlikle `push /errors/dogukan { at: 1, message: "x" }` → **izin verilmeli**
7. **API anahtarını kısıtla**
   Google Cloud Console → *APIs & Services → Credentials* → Firebase'in
   oluşturduğu *Browser key*:
   - *Application restrictions → Websites*:
     `https://serkanok1983.github.io/*`, `http://localhost:3000/*`,
     `http://localhost:4173/*`
   - *API restrictions → Restrict key*: **Identity Toolkit API** ve
     **Token Service API** (anonim oturum için yeterli; Realtime Database
     anahtarla değil oturum belirteciyle konuşur).
8. **Son kontrol:** uygulamada bir oyun oyna → Console'da
   `leaderboard/<slug>/dogukan` güncellenmeli; `/bilgi` açılmalı.

## Geri alma

Bir şey ters giderse *Realtime Database → Rules* sekmesinde önceki kuralları
geri yükle (Console sürüm geçmişi tutar). Uygulama tarafında geri almaya gerek
yoktur: yazımlar zaten sessizce başarısız olabilir.

## Notlar

- Firebase SDK ana sayfa parçalarına girmemelidir; `scripts/verify-out.mjs`
  yapılandırılmamış derlemede bunu uyarı olarak denetler.
- Yeni bir yol eklenecekse önce `database.rules.json` ve CONTRACT §16
  güncellenir.
