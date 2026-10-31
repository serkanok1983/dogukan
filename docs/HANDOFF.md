# Devir Teslim — "Doğukan'ın Yeri" Yeniden Tasarımı

> Bu belge, projeyi devralan ajan (veya insan) için yazıldı. Önceki oturum
> Claude Code (cloud) üzerinde çalıştı; iş başka bir IDE'de, API kredisi ile
> devam edecek. Buradaki her şey repodadır; dış bir dosyaya bağımlılık yoktur.

Son güncelleme: 2026-10-31 (sentez tamamlandı) · Dal: `claude/zealous-bell-8149v6` (kod olarak `main` ile aynı; yalnızca `docs/` eklendi)

> **Güncel durum:** Adım B (sentez) tamamlandı. Sentezde HANDOFF §4'teki
> uzlaşmalara eklenen/değiştirilen kararlar: kapsül rotası `/kesfet/[slug]/kapsul/`
> (K9); Faz 1'de hiçbir slug silinmez, kaldırılacaklar `hidden` ile gizlenir (K19);
> yeni slug yalnızca `ses-avi`, `guvenli-yol`, `blok-dunyasi`, `dur-git` (K20);
> `worlds.ts` açık slug→ada tablosudur, MENU yeniden gruplanmaz (K6); MEB kodları
> doğrulanmadan doldurulmaz (K21); Blok Dünyası ayrı paket S9 oldu (toplam 9
> paralel paket). Ayrıntı: `docs/plan/MASTER_PLAN.md §7`.

---

## 1. Görev (babanın isteği, özet)

Uygulama 6 yaşındaki Doğukan için. Çocuk mobil oyun ve kısa video bağımlısı;
mevcut site ilgisini çekemedi çünkü "Süper Ayı" ve "Minecraft" seviyesinde
oyun sunamadı. İstenen:

- Telefonda kolay kullanılan, **kendi isteğiyle açtığı**, eğlendiren bir uygulama.
- Eğlendirirken **öğreten ve yetiştiren**: beceriler, merak, zekâ, temel bilimlere ilgi, okula fayda.
- **Zararlı içerikten koruma**, sağlıklı kullanım.
- Ürünü **production seviyesine** getirmek (PWA, test, CI, lint temiz).
- Yeniden düzenleme, içerik ekleme/değiştirme serbest.

Çocuk okuma-yazmayı yeni öğreniyor (anaokulu / 1. sınıf): **her metin sesli olmalı**, UI ikon ve resim odaklı olmalı.

---

## 2. Mevcut kod tabanı (hızlı özet)

- Next.js 16.2.6 (App Router, Turbopack, React Compiler lint kuralları açık), React 19, Tailwind 4, TS strict.
- `output: "export"` ile statik; GitHub Pages'te `basePath=/dogukan` (bkz. `next.config.ts`, `.github/workflows/deploy-pages.yml`).
- Rotalar: `/` (giriş + menü), `/aktivite/[slug]` (69 etkinlik), `/kesfet` ve `/kesfet/[slug]` (Merak Ansiklopedisi, 14 konu), `/bilgi` (ebeveyn paneli).
- Oyuncular `dogukan` ve `serkan`, parolalar istemcide düz metin (`src/lib/auth.ts`).
- Firebase Realtime DB isteğe bağlı (skor tablosu + ziyaret günlüğü), env yoksa sessizce kapalı.
- Durum: `tsc` temiz, `next build` başarılı (90 sayfa), **lint 14 hata + 44 uyarı** (React Compiler kuralları: render'da ref erişimi, render'da `Math.random`, effect içinde senkron setState, korunamayan memoization; dosyalar: Asteroids, FightingArena, LaneRacer, RunnerDash, Pong, FlappyBird, bilgi/page, useGameScore).
- Test yok. CI'da lint/tip denetimi yok.
- **GitHub Actions limiti dolu:** CI kullanılmaz; kalite kapısı (`npm run check`) ve yayınlama (`npm run deploy` → `gh-pages` dalına elle itme) yerelde yapılır. Pages "legacy" modda `gh-pages` dalından yayınlıyor; depo herkese açık. Ayrıntı: `docs/plan/MASTER_PLAN.md §4.8` ve K30.
- `AGENTS.md`: Bu Next sürümünde kırıcı değişiklikler var; Next'e özgü kod yazmadan önce `node_modules/next/dist/docs/` okunmalı. İlgili rehberler:
  - `01-app/02-guides/static-exports.md`
  - `01-app/02-guides/progressive-web-apps.md`
  - `01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`
  - `01-app/02-guides/testing/vitest.md`, `.../testing/playwright.md`
  - `01-app/02-guides/production-checklist.md`

Ortam notları: Node 22, `npm ci` çalışıyor, npm registry erişilebilir (vitest 5.x, jsdom 30.x mevcut). Playwright 1.56 + Chromium `/opt/pw-browsers/chromium` (cloud ortamında; yerelde kurulum gerekebilir).

---

## 3. Nerede kaldık

Çok ajanlı bir "anla → tasarla → hakemle → sentezle" akışı çalıştırıldı (akış betiği: `docs/plan/workflow-understand-design.js`, tüm prompt'lar içinde). **11/13 ajan tamamlandı**, son iki adım haftalık kullanım limiti nedeniyle çalışmadı.

| Aşama                        | Durum  | Çıktı                                                                                                                                                               |
| ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anlama (5 okuyucu)           | ✅     | `docs/plan/maps/*.md` (5 dosya, her biri 250–410 satır)                                                                                                             |
| Tasarım (4 bakış açısı)      | ✅     | `docs/plan/proposals/*.md` (game-designer, pedagogy, mobile-production, parent-wellbeing)                                                                           |
| Hakem (3 puanlayıcı)         | ⚠️ 2/3 | `docs/plan/judgements/judge-1.md` (çocuk/oyun tasarımcısı gözü), `judge-2.md` (eğitimci/baba gözü). **Hakem 3 (staff engineer / uygulanabilirlik gözü) çalışmadı.** |
| Sentez (ana plan + sözleşme) | ✅     | `docs/plan/MASTER_PLAN.md` (Türkçe; tüm çatışma kararları §7) ve `docs/plan/CONTRACT.md` (İngilizce; arayüzler, dosya sahipliği §12, paket kabul ölçütleri §13)     |
| Uygulama                     | ❌     | Kod değişikliği yapılmadı — **sıradaki iş Adım C (çekirdek paket C0)**                                                                                              |

### Hakemlerin puanları (10 üzerinden; sıra: engagement / learning / feasibility / wellbeing)

| Öneri                         | Hakem 1       | Hakem 2       | Verdict (ortak)                                                                                                                                                      |
| ----------------------------- | ------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| game-designer ("Bal Adaları") | 8/7/5/7 = 27  | 9/7/5/7 = 28  | Çocuğa dönük omurga: ada haritası, ayı yoldaş, yıldız/çıkartma, Blok Dünyası, Merak kapsül akışı, oyun hissi. Ekonomi detayları ve Faz 1 sanat kapsamı reddedildi.   |
| pedagogy                      | 6/10/6/7 = 29 | 6/10/7/8 = 31 | Öğrenme mimarisinin tamamı: MEB kodlu beceri grafı, mastery, sesli egzersiz motoru, 69→45 etkinlik eşlemesi. "Oyun parkı görev bitmeden kilitli" açılışı reddedildi. |
| mobile-production             | 6/3/9/6 = 24  | 6/3/9/6 = 24  | Teknik zemin olarak aynen: PWA, SW, hata sınırları, tek progress store, Vitest, CI. Çocuğun gününü bu tanımlamaz.                                                    |
| parent-wellbeing              | 6/5/8/10 = 29 | 7/6/8/10 = 31 | Yönetişim katmanı: süre/sayaç/durma/övgü ile ilgili her çatışmayı bu karar verir. Atlanamaz 60 s mola yumuşatıldı.                                                   |

İki hakem de önerilerin **birbirini tamamladığını**, ortalanmak yerine her birinin kendi alanında alınmasını söylüyor.

---

## 4. Alınmış kararlar (iki hakemin uzlaştığı noktalar — sentez bunları korumalı)

Ayrıntı ve gerekçeler: `docs/plan/judgements/judge-1.md` §2–4 ve `judge-2.md` §2–4.

1. **Giriş:** Avatar'a dokunarak giriş, parola yok; dokunuş sesi/TTS'i de açar ve ayı selam verir. Ebeveyn için 4 haneli PIN (`/bilgi`), birlikte oyun için rastgele yetişkin aritmetik kapısı.
2. **Ana ekran:** 69 kartlı metin kataloğu yerine **ada haritası**; ≥96 px sesli resimli kutucuklar; çocuk yüzeyinde arama/sekme/çıkış yok. Adalar: Macera Adası, Harf Ormanı, Sayı Dağı, Şekil Köyü, Merak Gölü, Blok Dünyası + gizli "Baba ile". `worlds.ts`, yeniden gruplanan `MENU`'den türetilir (build-time invariant'lar korunur).
3. **Yoldaş:** Çocuğun ilk açılışta 4 sesli seçenekten adlandırdığı ayı (varsayılan "Bal"); Süper Ayı sprite'ı ile çizilir (marka köprüsü).
4. **1. gün:** Süper Ayı eski rekoruyla kahraman kutucuk; **ilk 3 gün hiçbir şey kilitli değil**; görevler parlar ama kapı değildir.
5. **Ses:** `speech.ts` her yerde; her yönerge otomatik okunur; ≥56 px tekrar düğmesi; rota değişimi/arka planda iptal; **fonem kuralı:** TTS'e tek ünsüz söyletilmez, her zaman kelime + resim. Baba'nın kaydedilmiş sesi için `public/voice/*.m4a` öncelikli yol şimdiden kurulur.
6. **Tek sayaç — Bal kavanozu:** Ebeveynin ayarladığı arcade dakikaları hücre olarak (1 🍯 = 2 dk); yalnızca **aktif arcade süresiyle** boşalır (ölmekle değil), 6 soruluk setle +2, kapsül bölümüyle +1, tavan var. Yıldızlar (bal değil) kozmetik alır. Blok serbest inşa ve kapsüller kavanozu boşaltmaz. Kavanoz bitince `RewardSheet`'te "🍯 Bal topla (3 soru)" / "🗺️ Harita" eşit düğmeler (oturumda en fazla 2 kez).
7. **Egzersiz motoru:** Pedagoji önerisinin `engine/types.ts`, `skills.ts` (MEB kodlu), `mastery.ts`; seeded üreticiler; 6 soruluk setler; ipucu→cevap; aralıklı tekrar. Faz 1 içerik: `sesAyirt`, `sesHarf`, `kelime`, `sayma`, `toplama`, `cikarma`, `oruntu`, `guvenli` L1–L3; harfler yalnızca 1–2. ses grubu; sürükleme yerine dokun-seç. Renderer'lar: `ChoiceCard`, `TapCount`, `OrderStrip`, `TraceCanvas`.
8. **Merak kapsülleri (sağlıklı "shorts"):** tam ekran kaydırmalı kartlar, 1 resim + ≤8 sesli kelime + 1 dokunuş; **tam 12 kart**, 12. kart gerçek dünya görevi, 13. kart yok, otomatik zincir yok, günde 2 bölüm. Rota: `/kesfet/[slug]/kapsul/` (hakem 2) — hakem 1 `/merak/[topic]/` demişti; **sentez karar verecek**, hakem 2'nin gerekçesi (tek `generateStaticParams`, ilgili bağlantılar geçerli kalır) daha güçlü. Faz 1 bölümleri: `isik-ve-golge`, `kalbim-ve-nefesim` (+ hakem 2: `miknatislar`, `tohumdan-bitkiye`).
9. **Blok Dünyası:** Serbest inşa + 5 kayıt + ayının üstünde yürümesi + "Babaya göster". Challenge modu, validator'lar, PNG galeri Faz 2. `engine.ts` saf kalır.
10. **Günlük sınır:** −5 ve −1 dakikada uyarı, **asla bir koşuyu kesmez**, günün yıldızları + yarının önizlemesi + görev ekranıyla biter. Akşam modu, yatma/uyanma ekranları. 20–25 dk'da bir `MolaScreen` (hareket kartı; ilk mola her zaman birlikte), ebeveyn ayarlanabilir, 30–45 s.
11. **Demote:** Dövüş ve atış oyunları (`dovus-arenasi`, `tank-savasi`, `uzayli-istilasi`, `meyve-bicagi`...) "Baba ile" kapısının arkasına. Babayla rekabet (ScoreHud rival, canlı kilometre taşı mesajları) çocuğa görünmez, varsayılan kapalı. `/kesfet` uzun makaleler, kaynak linkleri, `ActivityKnowledgePanel`, `IntroModal` metin duvarları yalnızca ebeveyn referansı; `IntroModal` → 1 resim + 1 sesli cümle + dev "Başla".
12. **Övgü:** Tüm çocuk geri bildirimi `praise.ts`'ten geçer: süreç övgüsü, kişi övgüsü yok, babayla karşılaştırma yok, yasaklı kelime testi, "Harika" oturumda en fazla 1.
13. **Kalıcılık:** mobile-production'ın event-sourced tek store'u (`dogukan-progress-v1:{player}`, saf reducer'lar, `useProgress(selector)`, monotonic-max merge). Yıldız tablosu/streak/görev/çıkartma reducer'ları bu store üstünde; `DayUsage` bir slice; `Settings` ayrı anahtar. Anahtar ayracı `:`.
14. **Streak:** kaçırılan gün sayacı sıfırlamaz, 1 düşürür; haftada 1 dondurma.
15. **Zorluk:** oyun başına `ease` (0.7'den başlar, 3 yıldızlı koşularla kendini ayarlar); koşular yine `ef.refleks` XP'si verir.
16. **Oyun hissi (6 oyun):** SuperBear, FlappyBird, RunnerDash, BalloonPop, WhackMole (setInterval arka plan bug'ı), MemoryGame (harf↔resim). `useGameLoop` (clamp'li dt), DPR'li `useCanvasFit`, ≥72 px başparmak bölgesi touch bar, haptics, `sounds.unlock()`, toast (modal yerine), `GameFrame` (daraltılmış topbar, iki dokunuşla çıkış, pause).
17. **Production:** `app/manifest.ts` (basePath'li), PNG ikonlar + `apple-icon.png`, elle yazılmış `public/sw.js` (`updateViaCache: "none"`), offline sayfası, `error.tsx` ×2 + `global-error.tsx` + Türkçe `not-found.tsx`, `GameErrorBoundary` (`{Activity()}` çağrısı düzeltilir), lazy Firebase + `database.rules.json`, Vitest invariant testleri (MENU ↔ registry ↔ knowledge ↔ guides, üreticiler, reducer'lar, praise, kapsüller), iki işli CI (lint `--max-warnings 0`), `verify-out.mjs` (bütçeler + çocuk yüzeyinde sıfır dış link). Playwright smoke non-blocking.
18. **Reddedilenler:** koşu başına bal −1; görev bitmeden arcade kilidi; oyun üstüne zorla açılan Bal Kapısı; Faz 1'de 120 SVG çıkartma / 6 ada illüstrasyonu (emoji-kart ile ~30 çıkartma, 5 kozmetik); saat manipülasyonu tespiti ile kilitleme (yalnızca logla); landscape/fullscreen katmanı (Faz 2); Web Push, rozet, loot-box, autoplay, sahte para dükkânı (asla).

---

## 5. Sıradaki adımlar (sırayla)

### Adım A — (isteğe bağlı) Hakem 3

Staff-engineer gözüyle uygulanabilirlik puanı. Prompt `docs/plan/workflow-understand-design.js` içindeki `JUDGE_LENSES[2]`'dir. İki hakem zaten teknik kapsamı (6 oyun, L1–L3, 2–4 kapsül, Playwright non-blocking) kıstığı için **atlanabilir**; sentezci bu gözü kendisi taşımalı.

### Adım B — Sentez (ZORUNLU, kod yazmadan önce)

Aşağıdaki iki belgeyi üret. Prompt'un tamamı akış betiğinde `phase('Synthesize')` altında; özeti:

**`docs/plan/MASTER_PLAN.md` (Türkçe):** 1) Ürün vizyonu 2) Deneyim mimarisi (ekranlar/akışlar, Türkçe UI metinleri) 3) Öğrenme mimarisi (skill id'leri, 69 etkinliğin eşlemesi, mastery, TTS politikası) 4) Teknik mimari (modül haritası, veri modeli, PWA, test, CI, lint) 5) Faz 1/2/3 iş paketleri 6) Kaldırılan/değiştirilen içerik 7) Riskler ve kararlar (hakemlerin her çatışmasına karar).

**`docs/plan/CONTRACT.md` (İngilizce):** Paralel çalışacak ajanların birbiriyle konuşmadan kodlayabileceği kesinlikte entegrasyon sözleşmesi: TS arayüzleri, modül yolları, export imzaları, event adları, localStorage anahtarları, CSS sınıf/token kuralları, rotalar, veri şekilleri. İçermeli: progress store API, event bus, skill id'leri, world/island modeli, `speech.ts`, haptics/sound, wellbeing/sessionClock/Settings, profil/giriş, oyunların sonuç bildirme yolu (`useGameScore` + yeni hook, oyunlarda minimum değişiklik), **dosya sahipliği haritası**.

Girdi: `docs/plan/maps/*`, `docs/plan/proposals/*`, `docs/plan/judgements/*` — hepsini tam oku. Hakemlerin "must-have / reject / conflicts" bölümleri bağlayıcıdır.

### Adım C — Çekirdek paket (tek ajan, önce) ← SIRADAKİ

Kapsam ve kabul ölçütleri: `CONTRACT.md §11–§13 (C0)`. Gerçek uygulamalar: store, olay veriyolu, reducer'lar, zaman, settings, skills, worlds, speech, haptics, rng, mastery kuralları; diğer her şey için imzası sabit saplamalar (§11) ve mevcut dosyalara küçük ekler (shim). Vitest altyapısı da C0'da kurulur (reducer/merge testleri için). Bitmeden paralel paketler başlamaz.

### Adım D — Paralel paketler (7–8 ajan, **ayrık dosya sahipliği**)

Hakemlerin birleştirdiği akış tablosu (judge-1 §4.14 ve judge-2 §4.17 — sentez tek tabloya indirecek):
Kesinleşmiş liste ve dosya sahipliği `CONTRACT.md §12`'de: S1 Kabuk/giriş · S2 Egzersiz motoru + konuşma · S3 İçerik ve katalog sahibi · S4 Oyun altyapısı/his + 14 lint hatası · S5 İlerleme · S6 İyi oluş + ebeveyn paneli · S7 Merak Kapsülleri · S8 Üretim/entegrasyon · S9 Blok Dünyası.
Paylaşılan dosyalar (`globals.css`, `menu.ts`, `registry.tsx`, `layout.tsx`) **tek sahipli**; diğerleri kendi CSS/modül dosyalarını oluşturur, sahip entegre eder.
Entegrasyon sırası: S8'in `<Activity/>` + `npm run check` betiği (CI yok) ve S1'in `auth.ts` önce; sonra S4/S5/S2 hook'ları; sonra S3/S6/S7; S8'in SW manifest'i en son `out/` üstünde.

### Adım E — Doğrulama

`npm run lint` (0 hata, hedef 0 uyarı), `npx tsc --noEmit`, `npm test`, `npm run build`, `verify-out`; 69 etkinliğin tamamı çalışır durumda; mobil viewport'ta (390×844) Playwright smoke. Ardından adversarial review (her bulgu için "çürüt" denemesi), düzeltme, commit, push.

### Kesin kurallar

- Faz 1 **69 mevcut etkinliği çalışır bırakır**.
- Lint kurallarını devre dışı bırakarak değil, kodu düzelterek temizle.
- Çocuk yüzeyinde dış link yok; Firebase yoksa her şey çalışır (silent-fail).
- Commit mesajları Türkçe (repo geleneği); model adı commit/kod içine yazılmaz.

---

## 6. Babaya açık sorular (ilk `/bilgi` onboarding'inde de sorulur; varsayılanlarla ilerlenebilir)

1. Telefon/OS (Android Chrome mi, iPhone Safari mi) — PWA kurulum yolu buna göre.
2. Anaokulu mu 1. sınıf mı; sınıf hangi ses grubunda (e-l-a-k-i-n...)?
3. Günlük toplam / arcade dakikası ve yatma saati varsayılanları (öneri: 30–45 dk toplam, 16 dk arcade tabanı).
4. "Baba ile" oyunları (dövüş/atış) hiç kalsın mı?
5. Babayla rekabet çocuğa görünsün mü (varsayılan: hayır)?
6. İlk açılışı birlikte yapıp ~60–150 ses satırı kaydedecek misiniz (metin listesi sentezde verilecek)? Bu, kimsenin kodlayamayacağı en etkili varlık.
7. Firebase konsoluna erişim (anonim auth + kurallar) — çocuk yolunda hiçbir şey buna bağlı değil.
8. "Anne" için ikinci ebeveyn profili gerekli mi?

---

## 7. Dosya haritası (bu teslimle gelenler)

```
docs/
  HANDOFF.md                         ← bu belge
  plan/
    workflow-understand-design.js    ← çalıştırılan akış ve tüm prompt'lar
    maps/                            ← kod tabanı haritaları (5)
      shell-ui-mobile.md  game-infra.md  learning-content.md  encyclopedia.md  production-readiness.md
    proposals/                       ← 4 tasarım önerisi
      game-designer.md  pedagogy.md  mobile-production.md  parent-wellbeing.md
    judgements/                      ← 2 hakem raporu (3. yok)
      judge-1.md  judge-2.md
    MASTER_PLAN.md                   ← Adım B çıktısı (Türkçe ana plan)
    CONTRACT.md                      ← Adım B çıktısı (İngilizce entegrasyon sözleşmesi)
```
