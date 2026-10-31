# Ana Plan — "Doğukan'ın Yeri" Yeniden Tasarımı

> Sentez belgesi (Adım B). Girdiler: `docs/plan/maps/*` (5 kod haritası),
> `docs/plan/proposals/*` (4 öneri), `docs/plan/judgements/judge-1.md` ve
> `judge-2.md` (2 hakem; 3. hakem çalışmadı, uygulanabilirlik gözü bu belgede
> taşındı). Hakemlerin "must-have / reject / conflicts" bölümleri bağlayıcıdır;
> her çatışmanın kararı §7'dedir.
>
> Eşlik eden entegrasyon sözleşmesi: `docs/plan/CONTRACT.md` (İngilizce, kod
> yazan ajanlar için kesin arayüzler). Bu belge **ne** ve **neden**'i, sözleşme
> **tam olarak nasıl**'ı söyler. İkisi çelişirse arayüz konusunda CONTRACT,
> ürün kararında bu belge geçerlidir.
>
> Son güncelleme: 2026-10-31

---

## 0. Bir cümlede

Doğukan telefonundaki ayı simgesine kendi isteğiyle dokunur. Kendi adını verdiği
ayı onu karşılar. Haritada Süper Ayı rekoruyla onu bekler. Her şey sesli ve
resimlidir; öğrenme oyunla aynı görünür ve oyun süresini doldurur. Gün, kavgayla
değil önceden haber verilmiş bir "bugünlük bu kadar"la biter. Baba da akşam 20
saniyede neyin işe yaradığını görür.

### Gerçekçi başarı ölçütü (hakem 1 §0)

Hiçbir plan tek oturumda Super Bear Adventure ya da Minecraft'ı ham eğlencede
geçemez. Babaya böyle bir söz verilmez. Kazanılabilecek yarış şudur: Uygulama
**onun** olur: kendi fotoğrafı, adını verdiği ayı, babasının sesi, babasına
gösterdiği yapılar. Ana ekranda durur, gerçek bir uygulama gibi hissettirir ve
zorla koparılmak yerine zarifçe biter. İki hafta sonraki hedefler (pedagoji §5
başarı ölçütleri):

1. Haftada ≥ 4 gün kendiliğinden açılması.
2. Ortanca oturumun 10–20 dk olması ve bunun ≥ %35'inin öğrenme adalarında geçmesi.
3. `tr.ses-harf` becerisinin L2'de olması (1–2. ses grupları), ilk denemede ≥ %80 doğruyla.
4. `mat.sayma` becerisinin L3'te olması (20'ye kadar).
5. En az bir ev görevinin birlikte yapılmış olması.
6. Gün sonunun ağlamasız bitmesi (`sessionsEndedBy.limit` artarken `extension` sayısının düşük kalması).

---

## 1. Ürün vizyonu

### 1.1 İlk 5 dakika (1. gün, cumartesi öğleden sonra, ilk açılış babayla birlikte)

1. Ana ekrandaki ayı simgesine dokunur. Uygulama tam ekran açılır: tarayıcı
   çubuğu da beyaz flaş da yoktur, sunucuda çizilmiş gökyüzü hemen görünür.
2. "Kim oynuyor?" ekranında kendi büyük fotoğrafına dokunur. Bu dokunuş sesi ve
   TTS'i açar. Ayı el sallar: _"Hoş geldin Doğukan! Ben senin ayınım. Bana bir
   isim ver."_
3. Dört sesli isim çipi çıkar: **Bal · Pati · Fıstık · Kaptan**. "Kaptan"ı seçer.
   _"Kaptan! Ne güzel isim. Bugün tanışma günü: istediğin adaya git."_
4. Harita açılır: altı ada ve büyük bir **"Devam et ▶ Süper Ayı"** kutucuğu.
   Ses: _"Rekorun hâlâ burada: 1240."_ Günün Görevi kutucuğu yanında parlar ama
   kilit değildir.
5. Süper Ayı aynı oyundur, aynı slug ve aynı rekordur. Ama artık net görünür,
   120 Hz telefonda doğru hızda çalışır, düğmeler başparmak bölgesindedir ve
   telefon titrer. Okunacak tek satır yoktur.
6. Ölünce iki eşit düğmeli bir sayfa açılır: **▶ Tekrar · 🗺️ Harita**. Yıldız
   üst çubuğa uçar ve bir çıkartma belirir.
7. İlk 3 gün hiçbir şey kilitli değildir (tanışma günleri). Yalnızca günlük üst
   sınır, molalar ve yatma saati geçerlidir. Bunlar "ayının kendi düzeni" diye
   anlatılır: _"Ben de mola veririm."_

### 1.2 7. gün

- Okuldan sonra uygulamayı kendisi açar. Kaptan, e-l-a harfleriyle kazanılmış
  bir şapka takıyor.
- Bal kavanozunda 8 hücre var. Bunlar bugünün oyun dakikalarıdır, görebileceği
  bir şey olarak çizilmiştir.
- Önce Günün Görevi'ni yapar, çünkü kutucuk parlıyor ve kavanozu dolduruyor.
- **Merak Gölü**'nde 12 kartlık mıknatıs bölümünü kaydırarak izler. 12. kart
  _"Babanla dene: buzdolabında mıknatıs ara 🔔"_ der ve akış biter. 13. kart
  yoktur.
- **Blok Dünyası**'nda üç kayıtlı dünyası var; birine "Babaya göster" demiş.
- 20:00'de harita amber renge döner ve Macera Adası uyur. 20:30'da _"İyi geceler
  Doğukan"_ der; bu ekranda ebeveyn çarkı dışında hiçbir şey dokunuşa yanıt
  vermez.
- Baba `/bilgi`'de şunları görür:
  - Bugün 31 dk: 12 öğrenme · 15 oyun · 4 keşif.
  - 2 mola alındı; yatma saatine uyuldu.
  - _k_ ve _i_ sesleri L2'de.
  - Bu akşam için bir öneri: _"Yemekte 'kkk-edi' diye ilk sesi uzatın."_
  - Birlikte yapılacak görev kartı.
- Uygulama hiç bildirim göndermedi, reklam göstermedi, dış bağlantı açmadı ve
  bir kez bile "zekisin" demedi.

### 1.3 Sağlıklı bağlılık tezi

| Alışkanlık                        | Şu an onu ne yakalıyor                          | Burada yerine geçen                                                                                          | Neden sağlıklı                                                                                                  |
| --------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Mobil oyun (Süper Ayı, Minecraft) | Karakter, dünya, koleksiyon, akıcı his          | Ada haritası, adını verdiği ayı, yıldız/çıkartma, Blok Dünyası, oyun hissi geçişi                            | Ödüller deterministik ve sonlu. Kutu/şans yok. Bal kavanozu süreyi görünür kılar. Koşular asla yarıda kesilmez. |
| Kısa video                        | Dikey kaydırma, tek fikir, anlık ses, sonsuzluk | **Merak Kapsülleri**: kaydırma, tek resim, ≤ 8 sesli kelime, her kartta bir dokunuş                          | Tam 12 kart, nokta rayı, gerçek dünya göreviyle biter, otomatik zincir yok, günde 2 bölüm                       |
| "Bir tane daha"                   | Tek düğmeli yeniden başlat                      | Her döngüde **tasarlanmış durma noktaları** (iki eşit düğme, 6 soruluk set, bölüm sonu, Günün Görevi bitişi) | Durmak çocuğun seçtiği bir şeydir, çarptığı bir duvar değil                                                     |

### 1.4 Nasıl öğretir

- **Öğrenme oyunla aynı yüzeydedir.** Aynı ayı, aynı yıldız ve aynı ödül
  sayfası kullanılır. Çocuk yüzeyinde "ders" kelimesi geçmez (test ile korunur).
- **Beceri grafı ve ustalık:** MEB çizgisinde 37 beceri vardır; seviye
  atlama/düşme kuralları açıklanabilir, aralıklı tekrar Leitner kutularıyla
  yapılır. Böylece "dünkü harf geri gelir" etkisi oluşur.
- **Ses esaslı Türkçe:** Ses grupları e-l-a-k-i-n sırasıyla gelir, önce küçük
  harf öğretilir. Yönergede **her zaman kelime + resim** verilir; TTS'e tek
  ünsüz asla söyletilmez.
- **Somuttan soyuta matematik:** Dokunarak sayma sırasında ses birlikte sayar;
  beşli sıralar, onluk çerçeve ve sayı doğrusu kullanılır.
- **Fen:** Kapsüllerde tahmin et → gözle → açıkla döngüsü kurulur. Her bölüm,
  babayla yapılacak gerçek bir deneyle biter.
- **Koruma öğretilir:** `hb.guvenli` becerisi şu durumu içerir: _"Ekranda korkunç
  bir şey gördün → kapat ve büyüğüne göster."_
- **Babaya içgörü:** Kazanım dilinde beceri kartları ve "Bu akşam birlikte"
  kartı. Ham zaman damgası listesi gösterilmez.

---

## 2. Deneyim mimarisi

### 2.1 Ekran haritası

```mermaid
flowchart TD
    A[Kim oynuyor? - avatar] -->|çocuk dokunur| B{İlk açılış?}
    A -->|Anne-Baba köşesi| P[Aritmetik kapı + PIN]
    B -->|evet| C[Ayıya isim ver]
    B -->|hayır| D[Ada haritası]
    C --> D
    D --> E[Ada ekranı: en fazla 12 kutucuk]
    D --> Q[Günün Görevi]
    D --> K[Merak Gölü: kapsül bölümleri]
    D --> BL[Blok Dünyası]
    D -->|gizli, aritmetik kapı| BI[Baba ile]
    E --> G[Etkinlik: StartCard - oyun veya egzersiz]
    Q --> G
    G --> R[RewardSheet: Tekrar / Harita]
    R --> D
    K --> M[12 kart - son kart görev]
    M --> D
    P --> PB[/bilgi ebeveyn paneli]
    D -.20-25 dk.-> MO[MolaScreen]
    D -.günlük sınır.-> L[LimitScreen]
    D -.yatma saati.-> N[NightScreen]
```

### 2.2 Giriş (S1)

- **"Kim oynuyor?"** ekranında Doğukan'ın 160 px'lik fotoğrafı (WebP, EXIF'siz)
  ve küçük bir "Anne-Baba 🔒" köşesi bulunur.
- **Çocuk:** Tek dokunuşla oturum açılır ve **kalıcı** olur (localStorage). Aynı
  dokunuş `unlockAudio()` çağırır. Ses: _"Hoş geldin Doğukan!"_ Bir sonraki
  açılışta doğrudan harita gelir.
- **Ebeveyn:**
  - Önce aritmetik kapı açılır (örn. "17 + 26 = ?", 64 px tuşlar), ardından
    4 haneli PIN istenir.
  - PIN, `NEXT_PUBLIC_PARENT_PIN_HASH` ile doğrulanır (SHA-256, tuzlu).
  - 3 hatalı denemede 30 sn kilit uygulanır: _"Babanı çağır 🙂"_.
  - Hash tanımlı değilse yalnızca aritmetik kapı uygulanır ve Sağlık kartı
    _"PIN ayarlanmadı"_ uyarısı gösterir.
- Çocuk yüzeyinde çıkış düğmesi yoktur; çıkış yalnızca `/bilgi`'den yapılır.
- `PlayerId`, `getPlayerId()` ve `dogukan-player` / `dogukan-logged-in`
  anahtarları korunur. Böylece leaderboard, activityLog ve skor geçmişi bozulmaz.
- Düz metin parolalar ve `checkCredentials` kaldırılır. README'ye şu not düşülür:
  _"PIN bir çocuk kapısıdır, güvenlik değildir."_

### 2.3 Ayıya isim verme (S1)

- Yalnızca ilk açılışta gösterilir.
- Dört sesli çip sunulur: Bal, Pati, Fıstık, Kaptan. Varsayılan "Bal"dır.
- ⭐ "Baban yazsın" seçeneği aritmetik kapının arkasında bir metin alanı açar.
- Seçim `settings.companionName` alanına yazılır. Tüm çocuk metinleri `{ayı}`
  yer tutucusunu kullanır.
- Para birimi hep "bal" kalır.

### 2.4 Ada haritası (S1)

- **Sunucuda çizilen iskelet:** Adalar ve etiketleri HTML'de gelir; hidrasyon
  öncesinde boş ekran yoktur.
- İstemci katmanı yıldız halkalarını, kavanozu, Devam kutucuğunu ve görevi
  ekler.
- Sayfa normal belge kaydırmasıyla kayar (en fazla ~3 ekran, 390×844 için).
- Arama, sekme, çıkış ve 📊 düğmesi yoktur. `BubbleBg` kaldırılır.
- **Üst çubuk (CompanionBar):**
  - Ayının yüzü. Dokununca konuşur: günün görevini ya da kavanozu anlatır.
  - 🍯 kavanoz (hücreler) ve ⭐ toplam yıldız.
  - 🔥 seri. Kaçırılan gün sayacı 1 düşürür; haftada 1 dondurma hakkı 🍦 vardır.
- **Devam et ▶:** Son oynanan etkinliği gösterir. 1. gün bu Süper Ayı'dır,
  rekoruyla birlikte.
- **Günün Görevi 🎒:** Üç noktalı parlayan bir kutucuktur; asla kapı değildir.
- **Adalar** (kutucuklar ≥ 96 px, resim + tek kelime):

| Ada             | id       | İçerik                                                                  |
| --------------- | -------- | ----------------------------------------------------------------------- |
| 🏝️ Macera Adası | `macera` | Arcade oyunları (Süper Ayı, Flappy, Koşu, Hafıza…)                      |
| 📖 Harf Ormanı  | `harf`   | Ses Avı, harf tanıma/yazma, hece, kelime                                |
| 🔢 Sayı Dağı    | `sayi`   | Sayma, toplama, çıkarma, sıra, saat, para                               |
| 🔷 Şekil Köyü   | `sekil`  | Şekiller, desen, simetri, mantık ve yürütücü işlev bulmacaları, Dur-Git |
| 🔬 Merak Gölü   | `merak`  | Kapsül bölümleri, Güvenli Yol, Hayat Bilgisi                            |
| 🧱 Blok Dünyası | `blok`   | Serbest inşa. Paket yetişmezse 🚧 olarak görünür.                       |
| 👨‍👦 Baba ile     | `baba`   | Gizli. Dövüş/atış oyunları, aritmetik kapının arkasında.                |

- **Kutucuk sesi:** Dokunuş tek kelimelik etiketi söyler. Gezinme `onend` anında
  ya da en geç 600 ms sonra olur. Görünür bir 🔊 çipi etiketi tekrarlar. Uzun
  basma yalnızca ebeveyn köşesi için ayrılmıştır (çocuk başparmağı için
  güvenilmez).
- **Ada ekranı:** Tek ekranda en fazla 12 kutucuk gösterilir. Her kutucukta
  resim, tek kelime ve 0–3 yıldız bulunur.
- **Ebeveyn girişi:** Ayının şapka köşesine 3 sn uzun basılır, ardından
  ParentGate açılır.
- **Akşam modu:** Haritaya `is-evening` filtresi uygulanır; arcade kutucukları 💤
  gösterir.

### 2.5 Etkinlik kabuğu (S4)

- **StartCard**, IntroModal'ın yerini alır: tek resim, tek sesli cümle ve dev bir
  **Başla** düğmesi. Başla dokunuşu `sounds.unlock()` çağırır. Egzersiz
  oturumlarında StartCard atlanır.
- **GameFrame:**
  - Oyun sırasında üst çubuk 48 px'lik ⏸ düğmesine daralır.
  - Çıkış için ⏸ → _"Gidiyor muyuz?"_ → ✅ Evet / ▶ Devam akışı izlenir. Kazara
    çıkış olmaz.
  - Duraklatma katmanı vardır. Devam ederken sesli 3-2-1 sayımı yapılır.
  - Opak üst çubuk kullanılır; tuvalin üstünde `backdrop-filter` yoktur.
- **ActivityKnowledgePanel** ve 💡/ℹ️ düğmeleri çocuk yüzeyinden kaldırılır. Bu
  veriler `/bilgi`'de etkinlik başına "Birlikte" kartı olarak gösterilir.
- **Kutlamalar:** Koşu sırasında yalnızca `toast` kullanılır (bloklamaz). Koşu
  sonunda `RewardSheet` açılır.
- **ScoreHud** yalnızca ikon gösterir: ⭐ ve sayı. Babayla rekabet metni
  `settings.rivalVisible` açık değilse görünmez (varsayılan kapalı).

### 2.6 RewardSheet: tek koşu sonu arayüzü (S5, S4 bağlar)

- Gösterilenler: kazanılan yıldızlar (1,5 sn sonra dokunarak geçilebilir
  animasyon), `praise()` satırı, kavanoz değişimi ve varsa yeni çıkartma.
- Düğmeler: **▶ Tekrar · 🗺️ Harita** (eşit boyut).
- Otomatik kapanma ve otomatik yeniden başlatma yoktur. Sayfanın kendisi bir
  durma noktasıdır.
- Aynı oyunda art arda 3 koşudan sonra, oturumda **bir kez** üçüncü bir seçenek
  eklenir: _"Başka bir adaya bakalım mı?"_ (sıradaki görev kutucuğuyla).
- **Kavanoz boşsa** düğmeler şöyle olur: **🍯 Bal topla (3 soru)** ve
  **🗺️ Harita** (eşit). "Bal topla" en zayıf beceriden 3 sesli soru açar ve
  ardından +1 hücreyle oyunu yerinde yeniden başlatır. Bu seçenek oturumda en
  fazla 2 kez sunulur; sonra yalnızca Harita kalır. Öğrenme adaları ve kapsüller
  açık kalır. Bal Kapısı asla oyunun üstüne kayan bir duvar değildir.
- Faz 1'de RewardSheet yalnızca `useGameRestart()` ile yeniden başlatma
  kaydettiren **6 amiral oyunda** gösterilir. Diğer oyunların kendi game-over
  arayüzü Faz 2'ye kadar kalır.

### 2.7 İlerleme: okumadan görülebilen (S5)

- **Yıldızlar:** Etkinlik başına 0–3 yıldız verilir ve tüm koşuların en iyisi
  geçerli olur. Arcade eşikleri `starRules.ts` tablosundadır (game-designer §2.1
  tablosu); öğrenme setinde 4/6 → 1 ⭐, 5/6 → 2 ⭐, 6/6 → 3 ⭐ alınır. Ada halkası
  kazanılan yıldızların olası yıldızlara oranını gösterir.
- **Çıkartmalar (~30):** Kart üstünde emoji olarak çizilir. Tetikleyicileri
  sabittir: ses grubu ustalığı, görev üçlüsü, seri 3/7/14, bir oyunda ilk 3
  yıldız, ilk kayıtlı Blok dünyası, ilk kapsül bölümü. Kilitliler silüet olarak
  görünür. Açılış 1 sn sonra sesle olur; soyma/kazıma tiyatrosu yoktur. Bir
  sonraki çıkartma önceden belirlidir.
- **Kozmetik (5):** Ayı için şapka/atkı gibi SVG katmanlar. **Yıldızla** alınır,
  asla balla alınmaz.
- **Seri:** Bir gün, en az bir öğrenme seti ya da kapsül bölümüyle "sayılır".
  Kaçırılan gün sayacı 1 düşürür; haftada 1 dondurma vardır.
- **Günün Görevi:** 3 slot vardır: (1) TR odak becerisi, (2) MAT odak becerisi,
  (3) kapsül bölümü ya da HB/EF seti. Zamanı gelmiş bir tekrar varsa bir slot
  onunla değiştirilir. Üçü bitince `ChapterEnd` açılır: _"Çanta doldu! Bugünlük
  bu kadar mı, devam mı?"_ (🗺️ Devam · 👋 Bugünlük bu kadar).
- **Zorluk (`ease`):** Oyun başına tutulur ve 0,7'den başlar. Her 3 yıldızlı
  koşudan sonra +0,05, 1 yıldız eşiğinin altında kalan 3 ardışık koşudan sonra
  −0,05 olur (0,6–1,0 aralığında). Koşular `ef.refleks` deneyimine de yazılır.

### 2.8 Egzersiz oturumu (S2 motor, S3 içerik)

- Set **6 maddeden** oluşur:
  - 4 madde odak beceriden gelir. İlk madde, seri 0 ise bir seviye aşağıdan
    ısınmadır.
  - 1 madde zamanı gelmiş tekrardır.
  - 1 madde komşu bir beceriden "sürpriz"dir.
- Yönerge otomatik okunur ve ≥ 56 px'lik 🔊 tekrar düğmesi vardır. Seçenekler
  2–4 resim/harf/sayıdan oluşur, her biri ≥ 96 px'tir.
- **Yanlış cevapta iskele:**
  - 1. yanlış: İpucuyla tekrar denenir; kelime daha yavaş okunur, resim nabız
       gibi atar, bir çeldirici solar.
  - 2. yanlış: Cevap gösterilir ve tek cümleyle açıklanır; madde setin sonuna
       yeniden eklenir.
- Vızıltı sesi yoktur; yanlış cevap yumuşak bir tonla karşılanır.
- Set sonunda yıldızlar, `praise("set_done_*")` satırı ve şu iki düğme gelir:
  **"Bir tane daha ⭐" / "Haritaya dön 🗺️"**. Set kavanoza +2 hücre ekler.
- `window.location.reload()` hiçbir yerde kullanılmaz.

### 2.9 Merak Kapsülleri (S7)

- Rota: `/kesfet/[slug]/kapsul/` (bölümü olan konular için `generateStaticParams`).
  Harita, Merak Gölü'ndeki bölüm kutucuklarından buraya bağlanır. `/kesfet` ve
  `/kesfet/[slug]` **ebeveyn başvuru sayfası** olarak kalır ve çocuk yüzeyinden
  bağlantı verilmez.
- Kartlar tam ekrandır ve `scroll-snap` ile ilerler. Her kartta tek görsel olur:
  emoji sahnesi ya da InteractiveLab'dan ayrılmış bir `*Stage` hazır ayarı.
  `say` ≤ 8 kelimedir ve büyük gösterilir.
- Ses, kartı açan dokunuşla başlar. `onend` sonrasında dokunma sorusu çıkar:
  2–3 resimli cevap ya da "bir daha dinle".
- Her bölüm tam **12 karttır** ve nokta rayı konumu gösterir. Kart sırası:
  kanca → (merak → laboratuvar POE → bilgi)×n → sözcük → 2 soru → **12. kart
  görev** (🔔 "Babanı çağır"). 13. kart ve "sonraki bölüm" düğmesi yoktur.
- Yanlış seçimde _"Birlikte bakalım"_ denir ve ≤ 8 kelimelik açıklama okunur.
  Puanlama yoktur.
- Günde en fazla `settings.episodesPerDay` (2) bölüm izlenir. Sonra şu gösterilir:
  _"Yarın yeni bölüm"_ ve yarının önizleme resmi.
- **Faz 1 bölümleri:** `isik-ve-golge` ve `kalbim-ve-nefesim` zorunludur.
  `miknatislar` ve `tohumdan-bitkiye` esnek hedeftir (kalite çıtası "annesine
  tekrar anlatır"; aceleyle dört bölüm yazılmaz).
- **Örnek kayıt (register):** game-designer §2.1'deki `isik-ve-golge` 12 kartı
  şablondur.
- `/kesfet/[slug]` kaynakları çocuk modunda düz metindir. Bağlantılar yalnızca
  ebeveyn modunda görünür (`/bilgi` oturumu açıkken).

### 2.10 Blok Dünyası (S9)

- **Serbest inşa:** Portre tuval kullanılır. 12×18 ızgarada hücre ≈ 30 css px'tir
  (390 genişlikte) ve çizim DPR'ye duyarlıdır.
- **Palet** 56 px'lik çiplerden oluşur ve 8 blok içerir: çim, toprak, taş, tahta,
  cam, su, çiçek, bal.
- **Etkileşim:** dokun = koy, sürükle = boya, ✖ çipi = sil. Büyük bir ↶ geri al
  düğmesi vardır.
- **5 kayıt yuvası** küçük resimlerle gösterilir.
- **Ayı** yapının üst yüzeyinde yürür (Süper Ayı sprite'ı; marka köprüsü).
- **"Babaya göster 📸":** Kaydın küçük resmi `/bilgi` galerisine düşer; Firebase
  yapılandırılmışsa oraya da yazılır. Web Share kullanılmaz; o bir dış kapıdır.
- **Saf motor (`engine.ts`):** `say` ve `ayna` doğrulayıcıları birim testli
  yazılır. Meydan okuma modu Faz 2'dedir.
- Kavanozu boşaltmaz ama günlük toplama sayılır.

### 2.11 İyi oluş katmanı (S6)

- **Bal kavanozu = tek sayaç:**
  - Ebeveynin belirlediği arcade dakikaları hücre olarak çizilir (1 🍯 = 2 dk).
  - Yalnızca **görünür ve çalışan bir arcade oyununda** boşalır; ölünce boşalmaz.
  - 6 soruluk set +2, kapsül bölümü +1, Bal topla +1 hücre ekler.
    `arcadeMaxMinutes` tavanı vardır.
  - Birlikte oyun (coplay) kavanozu boşaltmaz.
- **Günlük üst sınır:**
  - −5 dk'da ayı esner: _"Beş dakika kaldı. Son oyununu seç."_
  - −1 dk'da çubuk amber olur: _"Bu son tur!"_
  - Süre dolunca `run_end` beklenir (en fazla 120 sn), sonra `LimitScreen` açılır.
    Ekranda bugünün yıldızları, _"Yarın: …"_ önizlemesi, bir görev kartı ve 🔔
    vardır. Ses: _"Bugünlük bu kadar! Bugün çok şey yaptın."_
  - Ebeveyn çarkı → PIN → "+10 dk" ile uzatma yapılabilir.
- **Mola (MolaScreen):** Varsayılan olarak her 25 dk'da, bir sonraki doğal
  duraklamada açılır. Bir Hareket Kartı gösterir (`goz`, `zipla`, `gerin`,
  `flamingo`, `nefes`, `su`, `bul`, `sarıl`); ayı hareketi yapar ve ses sayar.
  Halka 30–45 sn sürer, ebeveyn bu süreyi ayarlayabilir. "Devam ▶" halka bitince
  çıkar; ebeveyn çarkı atlatabilir. **İlk mola her zaman `zipla`'dır ve babayla
  yapılır.**
- **Akşam modu ve yatma saati:**
  - `bedtime − 30 dk`'dan itibaren amber harita, yarım ses ve uyuyan arcade
    adaları.
  - `bedtime` ile `wakeFrom` arasında `NightScreen` gösterilir: _"İyi geceler
    {ad}. Yarın görüşürüz."_
- **Tanışma günleri:** Kurulumdan itibaren 3 gün boyunca kavanoz kapı olmaz. 3. gün ayı tek cümleyle anlatır: _"Yarından sonra bal böyle: oynarken azalır,
  öğrenirken dolar."_
- **Birlikte oyun:** 🔔 → zil sesi → yetişkin kartında "Baba buradayım" ve
  aritmetik kapı. Başarılı olursa 30 dk `coplay` açılır: Baba ile adası açılır
  ve kavanoz boşalmaz.
- **Kural:** Hiçbir sınır bir koşuyu, bir egzersiz maddesini ya da bir kapsül
  cümlesini yarıda kesmez.

### 2.12 Övgü dili (S6)

- Tüm çocuk geri bildirimi `praise.ts` üzerinden gider. Ölçütler:
  - Süreç övülür (dikkat, deneme, strateji); kişi övülmez.
  - Babayla dahil kimseyle karşılaştırma yapılmaz.
  - Satırlar ≤ 7 kelimedir ve son 3 satırda tekrar olmaz.
  - "Harika" oturumda en fazla bir kez kullanılır.
- Yasaklı kelimeler testle korunur: `zeki|akıllı|en iyi|mükemmel|geçtin|kaybettin|başarısız|ders|ödev|yasak`.

### 2.13 Ebeveyn paneli `/bilgi` (S6)

Kartlar tek kaydırmada, bu sırayla gelir:

1. **Bugün:** Toplam ve sınır için bir halka; arcade/öğrenme/keşif dağılımı;
   kavanoz; alınan molalar; yatma saatine uyum; sınırla biten oturumlar.
2. **Bu hafta:** 7 sütunlu grafik ve seri. Tek satırlık bir yargı da verilir:
   _"Öğrenme payı %38 — hedef %35 ✓"_.
3. **Beceriler:** "Şu an öğreniyor / Bu hafta ustalaştı / Zorlanıyor" başlıkları.
   Her satırda kazanım alanı yazar (kod doğrulanana kadar alan adı gösterilir,
   bkz. §7 K21).
4. **Bu akşam birlikte:** Kapsül görevi, bugün oynanan bir etkinliğin
   `talkQuestion` sorusu ve bir beceri ipucu. "Yaptık ✓" düğmesi vardır.
5. **Ne oynadı:** Güne göre gruplanmış oturumlar (ikon, ad, süre, yıldız, nasıl
   bittiği). Zaman damgası listesi yoktur.
6. **Blok galerisi:** "Babaya göster" denmiş yapılar.
7. **Ayarlar:** Tüm `Settings` alanları, "Telefona ekle 📲" (Android'de
   `beforeinstallprompt`, iOS'ta 3 adımlı kart), ilk açılış kontrol listesi,
   çıkış.
8. **Sağlık:** Çökme listesi, Firebase durumu, telefon saati, bulunan TTS sesi
   (yoksa _"Google Metin Okuma'da Türkçe sesi indirin"_), PIN durumu.

Ayrıca **"Tüm etkinlikler"** listesi bulunur. Haritadan gizlenen etkinlikler de
dahil 73 slug'ın tamamı ebeveyn için buradan erişilebilir kalır.

### 2.14 Temel çocuk metinleri

| An           | Metin (sesli + gösterilen)                                                     |
| ------------ | ------------------------------------------------------------------------------ |
| Giriş        | "Hoş geldin {ad}!"                                                             |
| İsim         | "Ben senin ayınım. Bana bir isim ver." → "{ayı}! Ne güzel isim."               |
| 1. gün Devam | "Rekorun hâlâ burada: {skor}."                                                 |
| Başla        | "Hazır? Üç, iki, bir!"                                                         |
| Çıkış        | "Gidiyor muyuz?" · ✅ Evet · ▶ Devam                                           |
| Koşu sonu    | `praise("run_end")` örn. "İyi oynadın. Ne öğrendin?"                           |
| Yeni yıldız  | "Yeni yıldız! Sabrın kazandı."                                                 |
| Kavanoz boş  | "Bal bitti. Üç soruyla bal toplayalım mı?"                                     |
| 3. gün       | "Yarından sonra bal böyle: oynarken azalır, öğrenirken dolar."                 |
| −5 / −1      | "Beş dakika kaldı. Son oyununu seç." / "Bu son tur!"                           |
| Sınır        | "Bugünlük bu kadar! Bugün çok şey yaptın."                                     |
| Akşam        | "Akşam oldu. Sakin oyunlar açık." · 💤 "Macera Adası uyuyor. Sabah görüşürüz." |
| Gece         | "İyi geceler {ad}. Yarın görüşürüz."                                           |
| Görev bitti  | "Çanta doldu! Bugünlük bu kadar mı, devam mı?"                                 |
| Kapsül sonu  | "Babanla dene: …" 🔔                                                           |
| Hata         | "Oyun biraz yoruldu 😴" · "Tekrar dene 🔁" · "Haritaya dön 🗺️"                 |

> "Harikaydın" gibi kişi övgüleri kullanılmaz. Sınır ekranı süreç cümlesiyle
> biter (wellbeing taslağındaki "Harikaydın" `praise.ts` kuralı gereği
> değiştirilmiştir).

---

## 3. Öğrenme mimarisi

### 3.1 Beceri grafı (`src/lib/skills.ts`, çekirdek paket)

37 beceri 6 kola ayrılır; her becerinin 5 seviyesi vardır. Faz 1'de içerik yalnızca
L1–L3 için yazılır.

| Kol                     | Beceri id'leri                                                                                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TR (Türkçe, ses esaslı) | `tr.ses-ayirt`, `tr.ses-harf`, `tr.harf-yaz`, `tr.hece`, `tr.kelime`, `tr.cumle`, `tr.dinle`, `tr.sozcuk`                                                                                                             |
| MAT (Matematik 1)       | `mat.sayma`, `mat.rakam`, `mat.sira`, `mat.ritmik`, `mat.toplama`, `mat.cikarma`, `mat.eksik`, `mat.oruntu`, `mat.sekil`, `mat.cisim`, `mat.simetri`, `mat.uzamsal`, `mat.olcme`, `mat.zaman`, `mat.para`, `mat.veri` |
| HB (Hayat Bilgisi)      | `hb.saglik`, `hb.guvenli`, `hb.duygular`, `hb.doga`                                                                                                                                                                   |
| FEN (bilimsel süreç)    | `fen.tahmin`, `fen.gozlem`, `fen.siniflama`                                                                                                                                                                           |
| EF (yürütücü işlev)     | `ef.hafiza`, `ef.isitsel`, `ef.dikkat`, `ef.ketleme`, `ef.planlama`, `ef.refleks`                                                                                                                                     |

Önkoşul kenarları (pedagoji §2.1):

- `tr.ses-ayirt → tr.ses-harf → tr.hece → tr.kelime → tr.cumle`
- `tr.ses-harf → tr.harf-yaz`
- `mat.sayma(L2) → mat.toplama(L1)`
- `mat.toplama(L2) → mat.eksik`
- `mat.sayma(L3) → mat.toplama(L3)`
- `mat.sekil → mat.cisim`
- `mat.sira → mat.ritmik`

Graf asiklik olmalıdır; bu testle korunur.

Ses grupları tek sabittir (`SOUND_GROUPS`): `e l a k i n / o m u t ü y / ö r ı d s b / z ç g ş c p / h v ğ f j`.
Okulun sırası farklıysa yalnızca bu sabit değişir (babaya soru §8-2).

### 3.2 Ustalık modeli (`src/lib/mastery.ts`)

- **Seviye atlama:** Seviyede art arda 3 ilk-deneme doğrusundan sonra.
- **Seviye düşme:** Art arda 2 yanlıştan sonra (1'in altına düşmez).
- **Aralıklı tekrar (Leitner):** Kutular 0–4'tür; `nextDueAt = now + [0,1,3,7,14][box]`
  gündür. Doğru tekrar kutuyu 1 artırır, yanlış 0'a indirir.
- **Ustalaşma:** `masteredAt`, L5'te seri ≥ 3 olduğunda yazılır. Faz 1'de L3'te
  seri ≥ 3, "bu hafta ustalaştı" kartı için yeterlidir.
- **Seçiciler:**
  - `dueSkills(now)`
  - `pickForSession(skill)`
  - `pickForGate()`: en zayıf beceriden 2 madde + ustalaşılmış bir beceriden
    1 güven maddesi.
  - `summary()`: ebeveyn paneli için.

### 3.3 Faz 1 içerik (S3): 8 üretici, L1–L3

| Üretici    | Beceri         | Gösterici                                                             | Bağlandığı slug             |
| ---------- | -------------- | --------------------------------------------------------------------- | --------------------------- |
| `sesAyirt` | `tr.ses-ayirt` | ChoiceCard (resim)                                                    | **yeni** `ses-avi`          |
| `sesHarf`  | `tr.ses-harf`  | ChoiceCard (harf), gruplar 1–2                                        | `harf-tanima`               |
| `kelime`   | `tr.kelime`    | ChoiceCard (küçük harf kelime ↔ resim), yalnızca ustalaşılmış harfler | `kelime-okuma`              |
| `sayma`    | `mat.sayma`    | TapCount (beşli sıra / onluk çerçeve)                                 | `sayma-oyunu`               |
| `toplama`  | `mat.toplama`  | ChoiceCard + onluk çerçeve görseli                                    | `toplama-oyunu`             |
| `cikarma`  | `mat.cikarma`  | ChoiceCard + üstü çizili nesneler                                     | `cikarma-oyunu`             |
| `oruntu`   | `mat.oruntu`   | ChoiceCard (desen şeridi)                                             | `desen-tamamla`, `sira-bul` |
| `guvenli`  | `hb.guvenli`   | ChoiceCard (sahne)                                                    | **yeni** `guvenli-yol`      |

Ek kurallar:

- `TraceCanvas`, `harf-yazma` için yalnızca 1–2. ses grubunun 12 küçük harfini ve
  0–9 rakamlarını kapsar.
- `OrderStrip`, `sayi-sirasi`'ndaki sabit `[3,7,1,9,5]` dizisinin yerine üretilmiş
  diziler kullanır (1–20).
- Kelime bankası (`content/tr/words.ts`) her ses için ≥ 6 resimli kelime içerir.
  Ğ hiçbir zaman ilk ses olarak sorulmaz; J için "jeton" ve "jöle" kullanılır.
- **Esnek hedef:** `dur-git` (yürütücü işlev / ketleme). Yetişmezse haritada gizli
  kalır.

### 3.4 73 etkinliğin beceri eşlemesi ve haritadaki yeri

Kısaltmalar: **K** koru (iyileştir) · **R** motorla yeniden yaz · **G** Faz 1'de
haritadan gizle (rota çalışır, `/bilgi` → Tüm etkinlikler'de görünür) · **B** Baba
ile kapısının arkasına taşı. Faz 1 **hiçbir slug'ı silmez** (§7 K19).

| Ada    | Slug                                                                                                    | Birincil beceri           | Faz 1 kararı                                               |
| ------ | ------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| macera | super-ayi                                                                                               | ef.refleks                | K: ease, oyun hissi, RewardSheet                           |
| macera | flappy-bird                                                                                             | ef.refleks                | K: ease, oyun hissi, RewardSheet                           |
| macera | kosu-macera                                                                                             | ef.refleks                | K: oyun hissi, RewardSheet                                 |
| macera | baloncuk-patlat                                                                                         | ef.dikkat                 | K                                                          |
| macera | balon-patlat                                                                                            | mat.toplama               | K: oyun hissi, RewardSheet (onluk çerçeve balonları Faz 2) |
| macera | kostebek-vur                                                                                            | ef.dikkat                 | K: setInterval arka plan hatası, RewardSheet               |
| macera | hafiza-kartlari                                                                                         | ef.hafiza                 | K: oyun hissi, RewardSheet (harf↔resim çiftleri Faz 2)     |
| macera | ziplama-adasi, yagmur-damlasi, top-yakala, serit-yarisi                                                 | ef.refleks                | K (dpr:1 opt-out, Faz 2 göç)                               |
| macera | tetris, labirent, kaydir-puzzle, yilan-oyunu, royal-match                                               | ef.planlama               | K (Tetris çift submit düzeltmesi)                          |
| macera | tugla-kir, pong                                                                                         | ef.refleks                | K (yatay katman Faz 2)                                     |
| harf   | harf-tanima                                                                                             | tr.ses-harf               | R: `sesHarf`                                               |
| harf   | ses-avi (yeni)                                                                                          | tr.ses-ayirt              | R: `sesAyirt`                                              |
| harf   | harf-yazma                                                                                              | tr.harf-yaz               | R: TraceCanvas, gruplar 1–2                                |
| harf   | kelime-okuma                                                                                            | tr.kelime                 | R: `kelime`                                                |
| harf   | hece-birlestir                                                                                          | tr.hece                   | K (Hece Treni Faz 2)                                       |
| harf   | sesli-harf                                                                                              | tr.ses-ayirt              | K (Ses Avı L4'e birleşme Faz 2)                            |
| harf   | benzer-kelime, bosluk-doldur                                                                            | tr.sozcuk / tr.dinle      | K (dil düzeyi temizliği)                                   |
| harf   | cumle-kur                                                                                               | tr.cumle                  | G (dilbilgisi üst-dili)                                    |
| harf   | alfabe-sirasi                                                                                           | —                         | G (2. sınıf)                                               |
| harf   | kelime-avcisi                                                                                           | tr.kelime                 | G (kopya)                                                  |
| sayi   | sayma-oyunu                                                                                             | mat.sayma                 | R: `sayma` + TapCount                                      |
| sayi   | toplama-oyunu                                                                                           | mat.toplama               | R: `toplama`                                               |
| sayi   | cikarma-oyunu                                                                                           | mat.cikarma               | R: `cikarma`                                               |
| sayi   | sayi-sirasi                                                                                             | mat.sira                  | R: OrderStrip üretilmiş                                    |
| sayi   | karsilastir                                                                                             | mat.sira                  | K (`>` sorusu silinir)                                     |
| sayi   | onluk-birlik                                                                                            | mat.sayma                 | K (yalnızca 20'ye kadar sorular)                           |
| sayi   | saat-ogren                                                                                              | mat.zaman                 | K (🕐 hatalı sorusu silinir; ClockFace Faz 2)              |
| sayi   | para-say                                                                                                | mat.para                  | K ("para üstü" silinir; Coins Faz 2)                       |
| sayi   | cift-tek                                                                                                | —                         | G (2. sınıf)                                               |
| sayi   | hizli-matematik, hedef-vur                                                                              | mat.toplama               | G (kopya)                                                  |
| sekil  | desen-tamamla, sira-bul                                                                                 | mat.oruntu                | R: `oruntu`                                                |
| sekil  | sekil-tani, sekil-say                                                                                   | mat.sekil                 | K (⬛ havuzu düzeltmesi)                                   |
| sekil  | sekil-ciz                                                                                               | tr.harf-yaz (hazırlık)    | K (Çizgi Çalışması Faz 2)                                  |
| sekil  | simetri                                                                                                 | mat.simetri               | K (MirrorGrid Faz 2)                                       |
| sekil  | tangram                                                                                                 | mat.sekil                 | G (sahte egzersiz; gerçek sürüm Faz 3)                     |
| sekil  | renk-atolyesi                                                                                           | fen.gozlem                | K                                                          |
| sekil  | renk-yaris                                                                                              | tr.sozcuk                 | K                                                          |
| sekil  | hazine-haritasi                                                                                         | mat.uzamsal               | K                                                          |
| sekil  | boyut-sirala                                                                                            | mat.olcme                 | K                                                          |
| sekil  | mantik-eslestir, grupla                                                                                 | tr.sozcuk / fen.siniflama | K                                                          |
| sekil  | fark-bul                                                                                                | ef.dikkat                 | K                                                          |
| sekil  | dur-git (yeni, esnek)                                                                                   | ef.ketleme                | yeni; yetişmezse G                                         |
| merak  | guvenli-yol (yeni)                                                                                      | hb.guvenli                | R: `guvenli`                                               |
| merak  | dinozor-kazi                                                                                            | fen.gozlem                | K                                                          |
| merak  | besin-gruplari                                                                                          | hb.saglik                 | K                                                          |
| merak  | hava-durumu, mevsimler, bitki-buyume                                                                    | hb.doga                   | K (lise düzeyi sorular silinir, ≥ 4 madde kalır)           |
| merak  | vucudumuz, su-dongu                                                                                     | hb.saglik / hb.doga       | K (dil düzeyi temizliği; kapsül sürümü Faz 2)              |
| merak  | gezegenler, hayvanlar                                                                                   | hb.doga                   | K (ExplorePanel; kapsüle taşınma Faz 2)                    |
| blok   | blok-dunyasi (yeni)                                                                                     | mat.simetri / mat.sayma   | yeni (S9)                                                  |
| baba   | dovus-arenasi, tank-savasi, uzayli-istilasi, uzay-savunma, asteroids, pinball-space-cadet, meyve-bicagi | ef.refleks                | B                                                          |

Kesin slug→ada ve slug→beceri tablosu `CONTRACT.md §5`'te veri olarak verilmiştir.

### 3.5 Uyarlanır zorluk

- **Egzersiz:** Seviye `mastery.ts`'ten gelir. L1'de 2 seçenek, L2'de 3, L3'te 4.
  Sayı aralıkları üretici dosyasında tanımlanır.
- **Arcade:** Oyun başına `ease` kullanılır (§2.7).
  - Süper Ayı: `nWolves = max(1, round((2 + L/7 + L/25) * ease))`, düşman hızı
    `× ease`.
  - Flappy: `PIPE_GAP = 128 + 60*(1-ease)`, `PIPE_SPD = 2.4 - 1.2*(1-ease)`.

### 3.6 TTS politikası

1. Çocuğa gösterilen her metnin bir `say` karşılığı vardır. Metin ikincil kanaldır.
   Çocuk metninde punto ≥ 18 px'tir.
2. Yönergeler otomatik okunur. ≥ 56 px'lik 🔊 tekrar düğmesi bulunur. Seçenekler
   cevap gösterildikten sonra da okunur.
3. **Fonem kuralı:** TTS'e tek ünsüz söyletilmez. Her zaman kelime + resim
   kullanılır ("kedi… hangi harf?"). İpucu kelimeyi daha yavaş tekrar okur.
4. Konuşma, onu tetikleyen dokunuşla başlar (iOS kuralı). Rota değişiminde ve
   arka plana geçişte iptal edilir. Arka plandan dönünce boş bir konuşmayla
   yeniden hazırlanır.
5. Ses sıralaması: Yelda → Google Türkçe → Microsoft Emel → herhangi bir `tr-*`.
   Ses yoksa metin büyük gösterilir, bir ses efekti çalınır ve Sağlık kartı uyarır.
6. **Kayıt öncelikli yol:** `public/voice/manifest.json` içinde bir id varsa
   `public/voice/<id>.m4a` çalınır, yoksa TTS kullanılır. Faz 1'de manifest boştur
   (`[]`). Babanın sesi Faz 2'de kodu değiştirmeden eklenir (metin listesi:
   `docs/plan/VOICE_SCRIPT.md`, S6 üretir).
7. `settings.voiceOn` kapalıysa altyazı büyür ve hareketli bir 🔊 düğmesi satırı
   dokunuşla okutur.

---

## 4. Teknik mimari

### 4.1 Modül haritası

```
src/lib/
  storage.ts            çekirdek  güvenli localStorage + tüm anahtar sabitleri
  settings.ts           çekirdek  Settings tipi, varsayılanlar, useSettings()
  skills.ts             çekirdek  SKILLS, SOUND_GROUPS, önkoşullar
  worlds.ts             çekirdek  WORLDS, ACTIVITY_INFO (slug→ada/tür/beceri/gizli)
  speech.ts             çekirdek  speak/cancel/unlockAudio + kayıt öncelikli yol
  haptics.ts            çekirdek  haptic(kind)
  rng.ts                çekirdek  mulberry32 tohumlu RNG
  mastery.ts            çekirdek (kurallar) → S2 (seçiciler)
  progress/types.ts     çekirdek  Progress, ProgressEvent, SkillState…
  progress/reducers.ts  çekirdek → S5  saf reduce + mergeProgress
  progress/store.ts     çekirdek  getProgress/subscribe/dispatch, kalıcılık
  progress/events.ts    çekirdek  trackEvent + onEvent (olay veriyolu)
  progress/starRules.ts S5        yıldız eşikleri
  quests.ts stickers.ts cosmetics.ts   S5
  wellbeing.ts sessionClock.ts praise.ts breaks.ts   S6
  capsules.ts           S7
  auth.ts               çekirdek (useSession) → S1 (PIN)
src/hooks/useProgress.ts            çekirdek
src/activities/engine/types.ts      çekirdek  Exercise, Visual, Generator
src/activities/engine/*             S2        ExerciseSession + 4 gösterici + görseller
src/activities/content/*            S3        üreticiler + kelime bankası
src/activities/games/blocks/*       S9
src/components/auth|home/*          S1
src/components/game/*               S4        GameFrame, StartCard, GameErrorBoundary…
src/components/progress/*           S5        RewardSheet, StickerAlbum, HoneyGate…
src/components/wellbeing|parent/*   S6
src/components/kesfet/*             S7        CapsuleFeed, CapsuleCard
src/components/pwa/*                S8
src/styles/*                        S8        globals.css bölünmüş hâli
```

### 4.2 Veri modeli ve kalıcılık

- **Tek yerel öncelikli depo:** `dogukan-progress-v1:{player}`.
  - Olay tabanlıdır: Her yazma bir `ProgressEvent` olur ve saf reducer'lardan
    geçer.
  - `useSyncExternalStore` ile okunur ve 300 ms gecikmeyle kalıcılaştırılır.
  - `storage` olayıyla sekmeler arasında eşitlenir.
- **Ayrı anahtarlar:**
  - `dogukan-settings-v1` (Settings; cihaz genelinde, çocuğu tanımlar; son yazan
    kazanır).
  - `dogukan-blocks-v1:{player}` (S9).
  - `dogukan-outbox-v1`, `dogukan-errors`, `dogukan-sound`, `dogukan-pin-lock`.
- **Birleştirme (çok cihaz):** `mergeProgress` değişmeli ve idempotenttir.
  - Monoton alanlar `max` ile birleşir: `best`, `stars`, `plays`, `seconds`, gün
    sayaçları.
  - Beceriler için `attempts` değeri büyük olan kazanır.
  - Çıkartmalar birleşim kümesiyle (union) birleşir.
  - Birim testiyle korunur.
- **Göçler (migrations):**
  - `dogukan-merak-ansiklopedisi-v1` → `topics` dilimi.
  - Oturum yalnızca sessionStorage'da olan çocuk kalıcı hâle getirilir.
  - Skor anahtarlarına dokunulmaz.
- **Firebase (isteğe bağlı, sessiz hata):**
  - Faz 1'de tembel `import()` kullanılır. Anonim kimlik doğrulama çağrısı ve
    `database.rules.json` eklenir.
  - Gün özetleri `users/{player}/days/{date}` yoluna yazılır.
  - Outbox yazılır; tam ilerleme eşitlemesi (flush) Faz 2'dedir.
  - Mevcut `leaderboard/` ve `activity/` yazımları sürer.
  - Konsol adımları `docs/ROLLOUT.md`'de yer alır.

### 4.3 Olay veriyolu

Tüm sinyaller `trackEvent(e)` üzerinden geçer:

- `run_start`, `run_end`, `level_complete`
- `exercise_item`, `exercise_set_end`
- `capsule_end`, `usage`, `break_done`, `limit_reached`, `session_end`
- … (tam liste: CONTRACT §3)

Depo durumu günceller. Yan etki dinleyicileri (`onEvent`) şunlardır:

- iyi oluş: doğal duraklama algılama;
- RewardSheet: koşu sonu;
- activityLog: gün özeti.

Ödül bildirimleri (yeni yıldız/çıkartma/görev) reducer tarafından
`progress.inbox`'a yazılır ve arayüz tarafından tüketilir. Reducer'lar saf kalır.

### 4.4 Oyunların sonuç bildirmesi (oyunlarda asgari değişiklik)

- `useGameScore` aynı dönüş şeklini korur:
  - `resetMilestones()` → `run_start`
  - `submitFinal(score)` → `run_end` (süre ile)
- Yeni `reportLevel(level)` → `level_complete`. Süper Ayı'nın hedef bloğu ve
  Tetris seviyesi bunu çağırır.
- `useGameRestart().registerRestart(fn)` yalnızca 6 amiral oyunda tek satırlık
  bir eklemedir.
- Diğer 26 oyun Faz 1'de **hiç düzenlenmez**. İstisna: lint hatası olan dosyalar
  (S4).

### 4.5 PWA

Okunması gereken Next 16 belgeleri:

- `01-app/02-guides/static-exports.md`
- `01-app/02-guides/progressive-web-apps.md`
- `01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`
- `01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md`
- `01-app/03-api-reference/04-functions/generate-viewport.md`

Kararlar:

- `src/app/manifest.ts` kullanılır. Gövde basePath'i kendisi ekler (`start_url`,
  `scope`, `icons[].src` hepsi `/dogukan` önekli). Bağlantı etiketini Next önekler.
- PNG ikonlar (192/512/maskable 512) ve `src/app/apple-icon.png` (180) eklenir.
  `apple-icon.svg` silinir (Next onu yok sayar).
- Service worker elle yazılır: `public/sw.js`. Turbopack nedeniyle Serwist
  kullanılmaz.
  - Karma statik dosyalar cache-first ile sunulur.
  - Gezinmeler ve `.txt` RSC dosyaları network-first, ardından önbellek, ardından
    `/offline/` yolunu izler.
  - Kayıt `updateViaCache: "none"` ile yapılır. Gerekçe: export'ta `headers()`
    yoktur.
  - Güncellemeler bir toast ile bildirilir. Çocuk yüzeyinde kurulum isteği
    gösterilmez.
- Web Push **asla** eklenmez (export'ta zaten mümkün değildir ve hedefe ters
  düşer).

### 4.6 Hata güvenliği

Belgeler: `03-file-conventions/error.md` ve `not-found.md`.

- `src/app/error.tsx` ve `src/app/aktivite/[slug]/error.tsx` bulunur
  (`unstable_retry`, tek satırlık bir `retry()` yardımcısıyla sarılır).
- `global-error.tsx` kendi `<html><body>` etiketlerini ve satır içi stilini çizer.
- Türkçe bir `not-found.tsx` eklenir.
- `GameErrorBoundary`, `<Activity/>` etrafına konur. `{Activity()}` çağrısı
  `<Activity/>` olarak düzeltilir; bu, gizli bir hooks kuralı hatasıdır.
- Hatalar `dogukan-errors` halkasına (20 kayıt) yazılır ve `/bilgi` Sağlık
  kartında gösterilir.
- `aktivite/[slug]` için `dynamicParams = false` ayarlanır
  (`02-route-segment-config/dynamicParams.md`).

### 4.7 Testler (Vitest)

Belge: `01-app/02-guides/testing/vitest.md`. Ortam jsdom'dur; kurulum dosyası
`AudioContext`, `speechSynthesis`, `vibrate` ve `canvas.getContext`'i taklit eder.

Bütünlük testleri:

- `MENU ↔ ACTIVITY_MAP ↔ ACTIVITY_KNOWLEDGE ↔ GUIDES ↔ ACTIVITY_INFO` birbirini
  tutmalıdır. Her `ACTIVITY_INFO.skill ∈ SKILLS`.
- Beceri grafı asiklik olmalıdır.
- Her üretici, seviye başına 1.000 tohumlu çekilişte şunları sağlamalıdır:
  cevap seçeneklerde yer alır, yinelenen seçenek yoktur, `say` boş değildir.
- Kapsüller: 12 kart, son kart görevdir, her kartta dokunuş vardır,
  `say` ≤ 8 kelimedir.
- Reducer'lar ve birleştirme yasaları.
- `computePhase` matrisi, `honeyLeft`.
- `praise`: tekrar yok, yasaklı kelime yok, ≤ 7 kelime. Çocuk metni denetimi.
- `manifest()` her iki ortam değeriyle doğru çıktı vermelidir.
- `sw.js` ayrıştırılabilmelidir.

Playwright: Yapılandırma ve tek bir smoke testi yazılır (390×844), **engelleyici
değildir**.

### 4.8 Kalite kapısı ve yayınlama (elle)

> **Kısıt:** GitHub Actions limiti dolu. Kapı ve yayınlama **yerelde, elle**
> yapılır. Plan Actions'a bağlı hiçbir adım içermez (§7 K30).

Belgeler: `upgrading/version-16.md` (`next build` artık lint çalıştırmaz),
`static-exports.md`.

- **`npm run check`** (yerel kapı, `scripts/check.mjs`): `lint --max-warnings 0`
  → `tsc --noEmit` → `vitest run` → `build:pages`
  (`NEXT_PUBLIC_BASE_PATH=/dogukan`) → `verify-out.mjs`. İlk hatada durur ve
  hangi adımın patladığını yazar. Playwright ayrı ve isteğe bağlıdır
  (`npm run e2e`).
- **`npm run deploy`** (elle yayın, `scripts/deploy-pages.mjs`):
  1. Çalışma ağacı temiz değilse ya da dal `main` değilse durur
     (`--allow-branch` ile aşılabilir).
  2. `npm run check` çalıştırır; geçmezse yayınlamaz.
  3. Gizli değerler `.env.local`'dan gelir (Next build bunu kendiliğinden
     yükler): 7 Firebase değişkeni + `NEXT_PUBLIC_PARENT_PIN_HASH` +
     `NEXT_PUBLIC_PIN_SALT`. Eksik olan uyarı olarak yazılır, yayını durdurmaz
     (uygulama bunlar olmadan da çalışır).
  4. `out/sw.js` içindeki `__BUILD_ID__` kısa commit SHA'sıyla değiştirilir;
     `out/.nojekyll` garanti edilir.
  5. `out/`, geçici bir git worktree üzerinden `gh-pages` dalına **yetim
     (orphan) commit** olarak yazılır. Mesaj şimdiki gelenekle aynıdır:
     `deploy: <tam SHA>`. Ardından `git push --force origin gh-pages`.
  6. `gh` kuruluysa Pages derleme durumunu (`gh api repos/serkanok1983/dogukan/pages/builds/latest`)
     izler ve sonucu yazar.
  7. `--dry-run` yalnızca 1–4'ü yapar ve neyin itileceğini listeler.
- **`.github/workflows/deploy-pages.yml`** silinmez. Tetikleyicisi yalnızca
  `workflow_dispatch` olur, böylece `main`'e her push dolu limite çarpan bir
  çalışma başlatmaz. Limit açılınca aynı betikleri çağıran iki işli sürüme
  (Faz 2) geçilebilir.
- **Yayın sonrası elle kontrol** (`docs/RELEASE.md`): canlı adreste
  `https://serkanok1983.github.io/dogukan/` sayfa açılıyor, manifest ve SW
  yükleniyor, telefonda "Yeni oyunlar hazır" toast'ı görünüyor.
- **`verify-out.mjs`:**
  - `/` JS ≤ 250 KB, CSS ≤ 35 KB.
  - Manifest ve `apple-touch-icon` mevcut olmalı.
  - `out/bilgi/` dışında hiçbir HTML'de `href="http` veya `target=` olmamalı.
    `/kesfet` kaynakları ebeveyn modunda istemci tarafında çizildiği için statik
    HTML'de görünmez.

### 4.9 Lint

14 hata kural kapatılarak değil, kod düzeltilerek giderilir (mobile-production
F15'teki satır satır düzeltmeler):

- `refs` ×6 → effect/state
- `purity` ×2 → olay işleyiciye taşıma
- `set-state-in-effect` ×2 → `useSession` ve türetilmiş değer
- `preserve-manual-memoization` ×4 → `useState(() => getPlayerId())` ve memo'lu
  context

44 uyarı da hedeftir:

- Kullanılmayan değişkenler silinir. SuperBear/Flappy'deki partiküller ise
  silinmek yerine **çizilir**.
- `exhaustive-deps` uyarıları `useEffectEvent` ile giderilir.

`reactCompiler: true` Faz 2'dedir.

---

## 5. Fazlar ve iş paketleri

### 5.1 Faz 1 (bu oturum)

**Sıra:**

1. **Çekirdek paket (C0)** tek başına yapılır.
2. Ardından **9 paralel paket** başlar. Dosya sahiplikleri ayrıktır; tam liste
   CONTRACT §12'dedir.
3. **Entegrasyon sırası:**
   1. S8 (`<Activity/>`, `check`/`deploy` betikleri) ve S1 (`auth.ts` PIN).
   2. S4, S5, S2 (kancalar).
   3. S3, S6, S7, S9.
   4. En son S8'in SW precache adımı, son `out/` üzerinde.
4. Her birleştirmeden sonra tam kapı çalıştırılır.

| Paket  | Başlık                | Hedef (özet)                                                                                                                                                                                                                                                                            |
| ------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C0** | Çekirdek sözleşme     | Tipler, depo, olay veriyolu, settings, skills, worlds, speech, haptics, rng, mastery kuralları, `useSession`, çapraz paket saplamaları (stub), yeni slug'ların kaydı                                                                                                                    |
| **S1** | Kabuk ve giriş        | Avatar girişi, PIN/aritmetik kapı, isim verme, ada haritası, ada ekranı, CompanionBar, Devam/Görev kutucukları, sunucu iskeleti; `MenuScreen`/`LoginScreen` kaldırma                                                                                                                    |
| **S2** | Egzersiz motoru       | `ExerciseSession`, `ChoiceCard`/`TapCount`/`OrderStrip`/`TraceCanvas`, görseller, mastery seçicileri, Bal topla oturumu (3 madde modu)                                                                                                                                                  |
| **S3** | İçerik ve menü sahibi | 8 üretici L1–L3, kelime bankası, `registry`/`menu`/`guides`/`activityLearning` sahipliği, R/G etiketli slug'lar, dil düzeyi temizliği, guides tek cümle, (esnek) Dur-Git                                                                                                                |
| **S4** | Oyun altyapısı ve his | `useGameLoop`, DPR `useCanvasFit`, `useCanvasPointer`, haptik/ses kilidi, başparmak touch bar, GameFrame/StartCard/pause, toast, `useGameRestart`, ease, 6 amiral oyun, 14 lint hatası + uyarılar                                                                                       |
| **S5** | İlerleme              | Reducer genişletmeleri (yıldız/seri/görev/çıkartma/kozmetik), `starRules`, `useGameScore` kancaları, `RewardSheet`, `HoneyGate`, `StickerAlbum`, `QuestTile` verisi, `ChapterEnd`, leaderboard rekabet gizleme                                                                          |
| **S6** | İyi oluş ve ebeveyn   | settings arayüzü, `sessionClock`, `wellbeing`, `praise`, `breaks`, `AppOverlays` (Mola/Limit/Night/Countdown/GraceHint/CoPlay), `/bilgi` v2, activityLog gün özetleri, VOICE_SCRIPT                                                                                                     |
| **S7** | Merak Kapsülleri      | `capsules.ts`, 2 (+2 esnek) bölüm, `CapsuleFeed`/`CapsuleCard`, `/kesfet/[slug]/kapsul/`, InteractiveLab `*Stage` ayrımı, kaynakların ebeveyn/çocuk ayrımı, `encyclopediaProgress` adaptörü                                                                                             |
| **S8** | Üretim                | manifest/ikonlar/SW/offline/PwaRegister/InstallCard, hata sınırları, `<Activity/>`, tembel Firebase + kurallar, CSS bölme, Vitest + bütünlük testleri, verify-out, `npm run check` + elle `npm run deploy` (CI yok), `.env.example`, `.nvmrc`, varlık temizliği, `layout.tsx` sahipliği |
| **S9** | Blok Dünyası          | Saf `engine.ts` (+ `say`/`ayna` testleri), çizici, palet, geri al, 5 kayıt, yürüyen ayı, Babaya göster                                                                                                                                                                                  |

Ayrıntılı dosya listeleri, tüketilen sözleşme API'leri ve kabul ölçütleri:
**CONTRACT §12–13**.

**Ortak kabul (her paket):**

- `npm run lint` (yeni dosyalarda 0 uyarı), `npx tsc --noEmit`, `npm test` ve
  `npm run build` geçmelidir.
- 73 etkinliğin tümü açılabilir kalmalıdır.
- Paket kendi kullanıcı akışını 390×844 görünümde çalıştırabilmelidir.

**Kesme sırası (zaman yetmezse, önce kesilecekler):**

1. Esnek kapsüller (`miknatislar`, `tohumdan-bitkiye`)
2. `dur-git`
3. Blok Dünyası'nda ayının yürümesi
4. Kozmetikler (5 → 0; yıldızlar kalır)
5. 6 amiral oyunun son ikisi (MemoryGame, BalloonPop)
6. Playwright

**Asla kesilmeyecekler:**

- Tanışma günleri + 3. gün açıklaması + −5/−1 uyarıları + koşu kesmeme kuralı
  (hakem 2 §5: dördü birlikte gelir).
- Avatar girişi.
- Konuşma katmanı.
- Hata sınırları.
- Yerel kalite kapısı (`npm run check`) ve elle yayın betiği.

### 5.2 Faz 2

- Babanın ses paketi (~150 klip): `speech.ts` değişmeden `public/voice/` altına
  eklenir.
- Kalan 10 kapsül konusu ve ExplorePanel/lise düzeyi sayfaların kapsüle
  taşınması.
- Faz 2 üreticileri: `cumle`, `dinle`, `eksik`, `sekil`/`cisim`, `simetri` +
  MirrorGrid, `zaman` + ClockFace, `para` + Coins, `ritmik`, `olcme`, `veri`,
  `duygular`, `doga`. Gösterici olarak SortBins (dokun-seç yedekli) eklenir.
- G etiketli slug'ların gerçekten silinmesi; üçlü değişmezden de (invariant)
  çıkarılır.
- Kaynaşma: Süper Ayı'da harf balı (ayı sesi bağırır), BalloonPop'ta onluk
  çerçeve, MemoryGame'de harf↔resim, Hazine Haritası'nda sesli `mat.uzamsal`.
- Kalan 24 tuval oyununun `useGameLoop`/DPR/RewardSheet göçü; RoyalMatch
  gradyan önbelleği.
- Blok Dünyası: meydan okuma modu (`kopyala`/`ayna`/`say`/`oruntu`/`yukseklik`),
  gündüz/gece kaydırıcısı, açılabilir bloklar.
- Firebase ilerleme eşitlemesi (outbox flush) ve PIN'in `/bilgi`'den
  değiştirilebilmesi (`settings/<player>.pinHash`).
- Yatay katman (`requestFullscreen` + `orientation.lock`, döndürme kartı) Baba ile
  oyunları için.
- `reactCompiler: true`, ada illüstrasyonları, ayı sprite atlası, çıkartma sanatı.
- Haftalık özet kartı, tatil modu, okul saati kilidi (babaya sorulur).
- Playwright'ı engelleyici yapmak.
- Actions limiti açılırsa: `check` + `deploy` iki işli iş akışı (aynı
  `scripts/check.mjs` ve `scripts/deploy-pages.mjs` betiklerini çağırır).

### 5.3 Faz 3

- Yerel iki kişilik oyun (Pong üst/alt, Köstebek bölünmüş tahta) yalnızca Baba ile
  adasında.
- "Babanın görevi": baba yarının görev kutucuğunu seçer ya da 5 sn'lik ses
  kaydeder.
- Gerçek tangram (sürükle-silüete, yakalamalı).
- Blok fiziği (kum/su), yaratıklar, "Babanın dünyası" yuvası.
- Device-motion ile zıplama sayma (izin istemleri nedeniyle Faz 3'te).
- "Anne" ikinci ebeveyn profili (babanın cevabına göre öne alınabilir).

---

## 6. Kaldırılan / değiştirilen içerik

| Öğe                                                                                                      | Karar                                                          | Gerekçe                                                                 |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `LoginScreen` yazılı form, `checkCredentials`, düz metin parolalar                                       | Kaldır                                                         | Çocuk yazamaz; ebeveyn parolası açık pakette duruyor                    |
| `MenuScreen`: arama, 8 sekme, 69 metin kartı, "69 aktivite", portal bandı, başlıktaki "Çıkış yap" / "📊" | Kaldır → ada haritası                                          | Okumayan çocuk metinle gezinemez; çıkış düğmesi çocuğun dokunduğu yerde |
| `BubbleBg` (her rotada rAF)                                                                              | Faz 1'de no-op, entegrasyon sonunda sil                        | Oyunların altında ikinci döngü; DPR yok                                 |
| `IntroModal` metin duvarları                                                                             | StartCard'a dönüştür                                           | Her oyunun önünde bir okuma kapısı                                      |
| `ActivityKnowledgePanel` oyun altında                                                                    | `/bilgi`'ye taşı (veri korunur)                                | 120–180 kelimelik yetişkin metni                                        |
| ScoreHud rakip paragrafı, `checkLiveMilestone` "Serkan'ı geçtin!"                                        | Ebeveyne özel (`rivalVisible` varsayılan kapalı)               | Bir hafta motive eder, sonra cesaret kırar                              |
| Koşu ortasında 3,2 sn'lik bloklayan kutlama                                                              | Toast                                                          | Süper Ayı/Flappy'yi koşu ortasında donduruyor                           |
| Kopyalar `hizli-matematik`, `kelime-avcisi`, `hedef-vur`                                                 | Faz 1 gizle, Faz 2 sil                                         | Çeşitlilik katmadan "69"u şişiriyor                                     |
| Sınıf dışı `alfabe-sirasi`, `cift-tek`, `cumle-kur`                                                      | Faz 1 gizle                                                    | 2. sınıf / üst-dil                                                      |
| Sahte `tangram`                                                                                          | Faz 1 gizle; `simetri`/`sekil-ciz` kalır (Faz 2 yeniden yazım) | Kaybedilemeyen oyun "çaba önemsiz" diye öğretir                         |
| Lise düzeyi sorular (eksen eğikliği, stoma, yüklem, sera etkisi, para üstü, 🕐, ⬛, "Jilet", `>`)        | Sil (havuzda ≥ 4 madde kalır)                                  | Bilgiler doğru ama yaş dışı; ebeveyn notlarına/kapsüllere taşınır       |
| Ölü havuzlar `Q.gezegenler`, `Q.hayvanlar`                                                               | Sil                                                            | Kullanılmıyor                                                           |
| Dövüş/atış oyunları + meyve bıçağı                                                                       | Baba ile kapısının arkasına                                    | "Zararlı içerikten korunsun"un somut hâli                               |
| `/kesfet` uzun makaleler, kaynak bağlantıları                                                            | Ebeveyn başvurusu; çocukta düz metin                           | Tek dokunuşla nasa.gov'a çıkış                                          |
| `window.location.reload()` yeniden başlatmalar                                                           | Durumu yerinde sıfırla                                         | 800 KB yeniden yükleme, ziyaret kaydının yinelenmesi                    |
| `activity/dogukan/visits` ham listesi                                                                    | Gün özetleri                                                   | "İçgörüsüz gözetim"                                                     |
| `dogukan.png` (760 KB, kökte), başlangıç SVG'leri, `apple-icon.svg`                                      | Sil                                                            | Kullanılmıyor / Next yok sayıyor                                        |
| Baloo 500, Nunito 600                                                                                    | Sil                                                            | ~60 KB, kullanılmayacak ağırlıklar                                      |
| Firebase SDK'nın ana rotada yüklenmesi                                                                   | Tembel import                                                  | Yapılandırılmamışken bile 155 KB                                        |

---

## 7. Riskler ve kararlar

Her hakem çatışmasının kararı aşağıdadır. "H1" hakem 1'i, "H2" hakem 2'yi gösterir.

| #   | Konu                                                                                 | Karar                                                                                                                                                                                                                                                                                                       | Neden                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| K1  | Ekonomi: koşu başına bal mı, enerji mi, kavanoz mu (H1-1, H2-1)                      | **Wellbeing kavanozu.** 1 🍯 = 2 dk; yalnızca aktif arcade süresi boşaltır; set +2, bölüm +1, Bal topla +1; tavan `arcadeMaxMinutes`. Kozmetik yıldızla alınır. `honey` ayrı sayaç değildir, `honeyLeft()`'ten türetilir.                                                                                   | Hızlı ölmek cezalandırılmaz; tek sayaç; bütçe sayacı aynı zamanda para olmaz                                                                           |
| K2  | 1. gün açılışı (H1-2, H2-2)                                                          | Avatar → isim → harita; Devam = Süper Ayı ve rekoru; Görev parlar; 3 tanışma günü                                                                                                                                                                                                                           | Babanın kaybettiği "önce ders" çerçevesinden kaçınılır                                                                                                 |
| K3  | Arcade kilidi (H2-3)                                                                 | Arcade ilk dakikadan açıktır. Görev öneridir; kapı değildir.                                                                                                                                                                                                                                                | "Asmakilitli ders" ilk günde kaybettirir                                                                                                               |
| K4  | Bal Kapısı tetikleyicisi (H2-4, H1 reject 3)                                         | Kavanoz boşken RewardSheet'te eşit düğmeler: "🍯 Bal topla (3 soru)" / "🗺️ Harita"; oturumda en fazla 2 kez. Günlük sınır → LimitScreen, Bal Kapısı yok.                                                                                                                                                    | "Reklam izle devam et" kokusunu taşımaz                                                                                                                |
| K5  | Yoldaş adı (H1-3, H2-5)                                                              | Çocuk 4 sesli seçenekten seçer; varsayılan "Bal"                                                                                                                                                                                                                                                            | Sahiplik                                                                                                                                               |
| K6  | Ada seti (H1-4, H2-6)                                                                | game-designer'ın altı adası + gizli Baba ile; Günün Görevi bir ada değil kutucuktur; Blok yetişmezse 🚧. `worlds.ts` açık bir slug→ada tablosudur; `MENU` Faz 1'de yeniden gruplanmaz.                                                                                                                      | Değişmezler korunur; S1 ile S3 aynı dosyayı düzenlemez (H1/H2 "MENU'den türet" demişti; uygulanabilirlik gerekçesiyle açık tablo seçildi, CONTRACT §5) |
| K7  | Motor tipleri (H1-5, H2-7)                                                           | Pedagoji tipleri (5 seviye, Faz 1'de L1–L3 içerik). Faz 1'de 4 gösterici: ChoiceCard, TapCount, OrderStrip, TraceCanvas. SortBins ve MirrorGrid Faz 2.                                                                                                                                                      | Üst küme; sürükle-bırak Safari riski                                                                                                                   |
| K8  | Kalıcılık (H1-7, H2-8)                                                               | mobile-production'ın olay tabanlı tek deposu; mastery/wellbeing/quests bu deponun dilimleri üzerinde saf modüllerdir; ayraç `:`                                                                                                                                                                             | Tek yazıcı, birleştirme yasaları                                                                                                                       |
| K9  | Kapsül rotası (H1-6 ↔ H2-9)                                                          | **`/kesfet/[slug]/kapsul/`**                                                                                                                                                                                                                                                                                | Tek `generateStaticParams` kaynağı; `relatedTopic` bağlantıları geçerli kalır; `/kesfet` ebeveyn sayfası olarak yerinde kalır                          |
| K10 | Faz 1 kapsül konuları (H1: 2, H2: 4)                                                 | Zorunlu: `isik-ve-golge`, `kalbim-ve-nefesim`. Esnek: `miknatislar`, `tohumdan-bitkiye`. Matematik konuları kapsüle girmez.                                                                                                                                                                                 | Kalite çıtası; fen/doğa akışı                                                                                                                          |
| K11 | Oyun hissi kapsamı (H2-10)                                                           | SuperBear, FlappyBird, RunnerDash, BalloonPop, WhackMole, MemoryGame; LaneRacer/Tetris/RoyalMatch `dpr:1` ile kalır                                                                                                                                                                                         | Çocuğun gerçek oyun menüsü + müfredat taşıyıcıları                                                                                                     |
| K12 | Mola / Limit adları (H1-8, H2-11)                                                    | `MolaScreen` = mola, `LimitScreen` = günlük sınır, `NightScreen` = gece; kavanoz boş → Bal topla/Harita (mola değil)                                                                                                                                                                                        | Ad karmaşasını bitirir                                                                                                                                 |
| K13 | Mola varsayılanı (H1 reject 8)                                                       | 25 dk, 30–45 sn halka, ebeveyn ayarlar, ilk mola babayla; ebeveyn çarkı atlatır                                                                                                                                                                                                                             | Atlanamaz 60 sn çocuğun hatırlayacağı tek kırgınlık olur                                                                                               |
| K14 | Varsayılan süreler (H1-12, H2-12)                                                    | Hafta içi 30 / hafta sonu 45 dk toplam; arcade tabanı 16 dk (8 🍯), tavan 26 dk; akşam 20:00, yatma 20:30, uyanma 07:00; 2 bölüm/gün                                                                                                                                                                        | Wellbeing şeması; hepsi düzenlenebilir; babaya sorulur                                                                                                 |
| K15 | Övgü (H1-10, H2-13)                                                                  | Tüm geri bildirim `praise.ts`'ten; ekran metinleri `content/voice.ts` ve çocuk metni testi                                                                                                                                                                                                                  | Süreç övgüsü                                                                                                                                           |
| K16 | Seri (H2-14)                                                                         | Kaçırılan gün −1, haftada 1 dondurma                                                                                                                                                                                                                                                                        | Cezalandırmayan döngü                                                                                                                                  |
| K17 | Ebeveyn PIN'i (H1-11, H2-15)                                                         | Aritmetik kapı = birlikte oyun için varlık; PIN = `/bilgi`. Faz 1: env hash, hash yoksa yalnızca aritmetik + uyarı. Faz 2: `/bilgi`'den değiştirilebilir.                                                                                                                                                   | Amaç başına bir kapı                                                                                                                                   |
| K18 | Kutucuk sesi (H2-16)                                                                 | Dokun = söyle + 600 ms içinde git; 🔊 çipi tekrarlar; uzun basma yalnızca ebeveyn                                                                                                                                                                                                                           | Çocuk başparmağı                                                                                                                                       |
| K19 | **"69 etkinlik çalışır kalsın" kuralı ile kaldırma kararları** (yeni)                | Faz 1 hiçbir slug'ı silmez. Kaldırılacaklar `ACTIVITY_INFO.hidden = true` ile haritadan gizlenir, rota çalışır ve `/bilgi` → Tüm etkinlikler'den erişilir. Silme Faz 2'de.                                                                                                                                  | HANDOFF'un kesin kuralı ile hakemlerin içerik kararını birlikte sağlar                                                                                 |
| K20 | Yeniden yazılan slug'lar                                                             | Mevcut slug'lar yerinde `ExerciseSession`'a geçer (aynı slug, aynı URL); yeni slug yalnızca `ses-avi`, `guvenli-yol`, `blok-dunyasi`, `dur-git`                                                                                                                                                             | Çocuğun geçmişi ve bağlantılar korunur                                                                                                                 |
| K21 | MEB kazanım kodları                                                                  | `skills.ts` her beceri için `mebArea` (ör. "Türkçe 1 · İlk okuma yazma") taşır; `mebCode` isteğe bağlıdır ve **resmî programdan doğrulanmadan doldurulmaz**. Ebeveyn paneli kod yoksa alan adını gösterir.                                                                                                  | Uydurma kod öğretmenle konuşmada zarar verir                                                                                                           |
| K22 | Firebase anonim kimlik doğrulama (H1-15)                                             | Kurallar ve çağrı eklenir; yazımlar sessizce başarısız olabilir; konsol adımları `docs/ROLLOUT.md`'de                                                                                                                                                                                                       | Çocuk yolunda Firebase'e bağımlı hiçbir şey yok                                                                                                        |
| K23 | Saat manipülasyonu (H1 reject 9)                                                     | Yalnızca `clock_jump` olarak loglanır ve Sağlık kartında gösterilir; kilitleme yok                                                                                                                                                                                                                          | Yaz saati/seyahat yanlış pozitifleri                                                                                                                   |
| K24 | Yatay katman, Playwright engelleyici, sanat kapsamı (H1 reject 4,10,11; H2 reject 9) | Faz 2. Faz 1: emoji-kart çıkartmalar (~30), 5 SVG kozmetik katmanı, mevcut Süper Ayı sprite'ı, 7 düz SVG/emoji ada                                                                                                                                                                                          | Tek oturumda mühendisle çizilen sanat yetersiz kalır                                                                                                   |
| K25 | Blok Dünyası kapsamı (H1 reject 5, H2-14)                                            | Serbest inşa + 5 kayıt + yürüyen ayı + Babaya göster (yerel galeri + yapılandırılmışsa Firebase); Web Share yok; validator'lar saf ve testli (`say`, `ayna`)                                                                                                                                                | Haftalık değer serbest inşada                                                                                                                          |
| K26 | Ödül dili ve çıkartma açılışı (H2 reject 10)                                         | Soyma/sürükleme açılışı yok; 1 sn sonra sesle otomatik açılış                                                                                                                                                                                                                                               | Kumar makinesi tiyatrosu                                                                                                                               |
| K27 | Ayı odası / bakım mekaniği (H2 reject 8)                                             | Yok; ihmal durumu yok                                                                                                                                                                                                                                                                                       | Suçluluk kaynaklı açılışlar                                                                                                                            |
| K28 | Gece denemeleri listesi (H2 reject 17)                                               | `bedtimeBlocks` yalnızca günlük sayı olarak gösterilir                                                                                                                                                                                                                                                      | Gözetim değil içgörü                                                                                                                                   |
| K29 | Üç hakemden biri eksik                                                               | Uygulanabilirlik gözü bu belgede taşındı: çekirdek önce gelir, saplamalar (stub) sayesinde paralel derleme mümkündür, paylaşılan dosyaların tek sahibi vardır, kesme sırası tanımlıdır                                                                                                                      | HANDOFF Adım A atlanabilir dedi                                                                                                                        |
| K30 | GitHub Actions limiti dolu (babanın notu)                                            | CI yok: kapı `npm run check`, yayın `npm run deploy` ile yerelde ve elle yapılır; `gh-pages` dalına yetim commit itilir (Pages zaten bu daldan, "legacy" modda yayınlanıyor). İş akışı dosyası yalnızca `workflow_dispatch` ile kalır. Paket kabul ölçütleri "CI yeşil" yerine "`npm run check` yeşil" der. | Depo herkese açık ve Pages kaynağı `gh-pages` dalı; dalı elle itmek bugünkü `peaceiris` adımının yaptığının aynısıdır                                  |

### 7.1 Kalan riskler

1. **iOS Safari'de Türkçe TTS güvenilirliği:** Her dokunuşta `unlockAudio()`
   çağrılır ve arka plandan dönünce yeniden hazırlanır. Asıl çözüm babanın ses
   paketidir (Faz 2).
2. **4. gün (kavanozun ilk ısırığı):** Tanışma günleri, 3. gün açıklaması, −5/−1
   uyarıları ve koşu kesmeme birlikte gelir. Baba ilk açılış kontrol listesini
   yapmadıysa panel çocuğu değil babayı uyarır.
3. **`dt` göçü oyun hissini değiştirebilir:** `dt60` çarpanı kullanılır, böylece
   sabitler 60 Hz'de aynı kalır. 120 Hz cihazda doğrulanır.
4. **Paralel entegrasyon:** Saplamalar ve dosya sahipliği haritası
   (CONTRACT §12) kullanılır. S8 birleştirme kuyruğunu yönetir.
5. **Depolama silinmesi (Safari, kurulmamış sekmede 7 gün):** PWA kurulumu
   önerilir. Eşitleme Faz 2'dedir.
6. **İçerik kalitesi:** Kapsül ve üretici metinleri babanın Türkçe gözden
   geçirmesinden geçer. Çocuk metni testi yalnızca yasaklı kelimeleri yakalar.

---

## 8. Babaya açık sorular

Varsayılanlarla ilerlenebilir. Sorular ilk `/bilgi` açılışındaki kontrol
listesinde de sorulur.

1. Telefon/OS nedir (Android Chrome mu, iPhone Safari mi)? PWA kurulum yolu ve
   TTS testi buna göre belirlenir.
2. Anaokulu mu, 1. sınıf mı? Sınıf hangi ses grubunda? `SOUND_GROUPS` ve
   başlangıç seviyeleri buna göre ayarlanır. Okuma-yazma defterinin ilk
   sayfasının fotoğrafı soruyu çözer.
3. Varsayılan süreler (K14) uygun mu? Okul saati kilidi istenir mi?
4. "Baba ile" oyunları (dövüş/atış/meyve bıçağı) hiç kalsın mı?
5. Babayla rekabet çocuğa görünsün mü? (Varsayılan: hayır.)
6. İlk açılışı birlikte yapıp ~60–150 ses satırını kaydeder misiniz? (Metin:
   `docs/plan/VOICE_SCRIPT.md`.)
7. Firebase konsoluna erişim var mı (anonim kimlik doğrulama + kurallar)?
8. "Anne" için ikinci ebeveyn profili gerekli mi?
