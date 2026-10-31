# Ses kayıt metni (VOICE_SCRIPT)

> Sahibi S6. Babanın kaydedebileceği satırlar, önceliğe göre gruplu. Her satırın
> bir **klip kimliği** vardır: kayıt `public/voice/<klip>.m4a` olarak eklenir ve
> kimlik `public/voice/manifest.json` dizisine yazılır. Kod değişmez; `speak(metin,
{ clip })` klibi bulursa çalar, bulamazsa TTS okur (CONTRACT §8.1).
>
> Bu tablolar koddaki metinlerden üretildi (`content/voice.ts`, `content/breaks.ts`,
> `lib/praise.ts`). Metin kodda değişirse burası da güncellenmeli.

## Kayıt ipuçları

- Sessiz bir odada, telefon ağızdan ~20 cm uzakta; sakin, gülümseyen bir ses.
- Her satır ayrı dosya: başta ve sonda ~0,2 sn sessizlik, `.m4a` (AAC), mono, 44,1 kHz.
- `{ad}` geçen satırları "Doğukan" diyerek, `{ayı}` geçenleri ayının seçilen adıyla
  okuyun (ad sonradan değişirse TTS'e geri düşülür; ayar ekranındaki adla kaydedin).
- Öncelik sırası: **1 → 3 → 4 → 2 → 5 → 6.** İlk 40 satır tek başına en büyük farkı yapar
  (karşılama, gece, sınır, mola kartları, sık övgüler).
- Ad eklenmiş övgüler ("Doğukan, dikkatle baktın!") TTS ile okunur; kayıt gerekmez.
- Değişken içeren `v-continue-record` (`{skor}`) kaydedilmez; TTS okur. `v-name-done`
  (`{ayı}`) yalnızca ayının adı kesinleştiyse kaydedilir.
- Mola sayımı 5. bölümdeki sayı kliplerini art arda çalar (aralar ~0,9 sn); sayıları
  tek tek, aynı tonda okuyun.

## Satırlar

### 1. Karşılama ve temel ekranlar (`content/voice.ts` · `VOICE`)

| #   | Klip                | Metin                                                        |
| --- | ------------------- | ------------------------------------------------------------ |
| 1   | `v-welcome`         | Hoş geldin {ad}!                                             |
| 2   | `v-name-ask`        | Ben senin ayınım. Bana bir isim ver.                         |
| 3   | `v-name-done`       | {ayı}! Ne güzel isim.                                        |
| 4   | `v-continue-record` | Rekorun hâlâ burada: {skor}.                                 |
| 5   | `v-start`           | Hazır? Üç, iki, bir!                                         |
| 6   | `v-exit-ask`        | Gidiyor muyuz?                                               |
| 7   | `v-jar-empty`       | Bal bitti. Üç soruyla bal toplayalım mı?                     |
| 8   | `v-grace-hint`      | Yarından sonra bal böyle: oynarken azalır, öğrenirken dolar. |
| 9   | `v-warn5`           | Beş dakika kaldı. Son oyununu seç.                           |
| 10  | `v-warn1`           | Bu son tur!                                                  |
| 11  | `v-limit`           | Bugünlük bu kadar! Bugün çok şey yaptın.                     |
| 12  | `v-evening`         | Akşam oldu. Sakin oyunlar açık.                              |
| 13  | `v-evening-tile`    | Macera Adası uyuyor. Sabah görüşürüz.                        |
| 14  | `v-night`           | İyi geceler {ad}. Yarın görüşürüz.                           |
| 15  | `v-chapter-end`     | Çanta doldu! Bugünlük bu kadar mı, devam mı?                 |
| 16  | `v-error`           | Oyun biraz yoruldu.                                          |

### 2. İyi oluş kaplamaları (`WB_LINES`, `TOMORROW`, `MISSIONS`)

| #   | Klip                 | Metin                                                    |
| --- | -------------------- | -------------------------------------------------------- |
| 17  | `wb-break-start`     | Mola zamanı! Hadi biraz hareket.                         |
| 18  | `wb-first-break`     | Babanla birlikte! İlk molayı beraber yapın.              |
| 19  | `wb-break-ready`     | Halka doldu. Devam etmeye hazırsın.                      |
| 20  | `wb-honey-low`       | Bal azalıyor. Son oyunlarını seç.                        |
| 21  | `wb-limit-stars`     | Bugünkü yıldızların burada.                              |
| 22  | `wb-coplay-called`   | Babanı çağırdım! Biraz bekleyelim.                       |
| 23  | `wb-coplay-start`    | İkiniz birlikte! Hadi.                                   |
| 24  | `wb-grace-ok`        | Tamam!                                                   |
| 25  | `wb-album-open`      | Çıkartmalarına bakalım.                                  |
| 26  | `wb-tomorrow-macera` | Yarın Macera Adası'nda yeni bir koşu var.                |
| 27  | `wb-tomorrow-harf`   | Yarın Harf Ormanı'nda yeni bir ses var.                  |
| 28  | `wb-tomorrow-sayi`   | Yarın Sayı Dağı'nda yeni bir şey var.                    |
| 29  | `wb-tomorrow-sekil`  | Yarın Şekil Köyü'nde yeni bir şekil var.                 |
| 30  | `wb-tomorrow-merak`  | Yarın Merak Gölü'nde yeni bir soru var.                  |
| 31  | `wb-tomorrow-blok`   | Yarın Blok Dünyası'nda yeni bir yapı var.                |
| 32  | `wb-tomorrow-baba`   | Yarın babanla yeni bir oyun var.                         |
| 33  | `wb-mission-1`       | Babanla dene: evde üç yuvarlak şey bulun.                |
| 34  | `wb-mission-2`       | Babanla dene: gölgenizi ölçün.                           |
| 35  | `wb-mission-3`       | Babanla dene: masadaki çatalları sayın.                  |
| 36  | `wb-mission-4`       | Babanla dene: adının ilk sesiyle başlayan bir şey bulun. |
| 37  | `wb-mission-5`       | Babanla dene: evdeki pencereleri sayın.                  |
| 38  | `wb-mission-6`       | Babanla dene: kalbinin sesini dinleyin.                  |
| 39  | `wb-mission-7`       | Babanla dene: evde kırmızı ve mavi şeyleri ayırın.       |

### 3. Hareket Kartları (`content/breaks.ts`)

| #   | Klip          | Metin                                                   |
| --- | ------------- | ------------------------------------------------------- |
| 40  | `br-goz`      | Pencereye bak. En uzaktaki şeyi bul. Ona kadar sayalım. |
| 41  | `br-zipla`    | Ayağa kalk. Beş kere zıpla!                             |
| 42  | `br-gerin`    | Ayı gibi gerin. Kollar yukarı, yavaşça aşağı. Üç kere.  |
| 43  | `br-flamingo` | Flamingo ol! Tek ayak üstünde dur. Beşe kadar sayalım.  |
| 44  | `br-nefes`    | Burnundan bal kokla. Ağzından mumu söndür. Üç kere.     |
| 45  | `br-su`       | Bir bardak su iç. Dönünce bana el salla.                |
| 46  | `br-bul`      | Odada üç kırmızı şey bul. Bana göster!                  |
| 47  | `br-saril`    | Yanında biri var mı? Ona bugün ne oynadığını anlat.     |

### 4. Övgü satırları (`lib/praise.ts`, klip = `praiseClip(satır)`)

| #   | Klip                  | Metin                                  |
| --- | --------------------- | -------------------------------------- |
| 48  | `p-correct-first-1`   | Dikkatle baktın!                       |
| 49  | `p-correct-first-2`   | Buldun. Nasıl bildin?                  |
| 50  | `p-correct-first-3`   | Kulağın iyi dinledi.                   |
| 51  | `p-correct-first-4`   | Tam isabet.                            |
| 52  | `p-correct-first-5`   | Sakin baktın, buldun.                  |
| 53  | `p-correct-first-6`   | Gözlerin iyi aradı.                    |
| 54  | `p-correct-first-7`   | Harika, dikkatle dinledin.             |
| 55  | `p-correct-retry-1`   | Bir daha denedin ve buldun!            |
| 56  | `p-correct-retry-2`   | Pes etmedin. İşte bu.                  |
| 57  | `p-correct-retry-3`   | İkinci deneme, doğru!                  |
| 58  | `p-correct-retry-4`   | Tekrar baktın, buldun.                 |
| 59  | `p-correct-retry-5`   | Denedin, düşündün, buldun.             |
| 60  | `p-wrong-try-again-1` | Henüz değil. Bir daha dinle.           |
| 61  | `p-wrong-try-again-2` | Hmm, tekrar bakalım.                   |
| 62  | `p-wrong-try-again-3` | Yaklaştın. Bir kez daha.               |
| 63  | `p-wrong-try-again-4` | Bir daha dene, olur.                   |
| 64  | `p-wrong-try-again-5` | Dikkatle dinle, yine dene.             |
| 65  | `p-wrong-reveal-1`    | İşte bu. Şimdi biliyorsun.             |
| 66  | `p-wrong-reveal-2`    | Cevap buydu. Bir dahakine!             |
| 67  | `p-wrong-reveal-3`    | Bak, bu. Şimdi öğrendin.               |
| 68  | `p-wrong-reveal-4`    | Yanlışlar öğretir. İşte cevap.         |
| 69  | `p-wrong-reveal-5`    | Birlikte bakalım: cevap bu.            |
| 70  | `p-set-done-high-1`   | Altı soru, hepsi senin.                |
| 71  | `p-set-done-high-2`   | Çok çalıştın, oldu.                    |
| 72  | `p-set-done-high-3`   | Bütün sette dikkatin açıktı.           |
| 73  | `p-set-done-high-4`   | Her soruya iyi baktın.                 |
| 74  | `p-set-done-high-5`   | Sabırla çalıştın, bitti!               |
| 75  | `p-set-done-low-1`    | Zor bir setti. Beynin çalıştı!         |
| 76  | `p-set-done-low-2`    | Yanlışlar öğretir. Yarın yine.         |
| 77  | `p-set-done-low-3`    | Zorlandın ama bitirdin.                |
| 78  | `p-set-done-low-4`    | Denedikçe beynin büyüyor.              |
| 79  | `p-set-done-low-5`    | Bitirdin! Zor sorular da öğretir.      |
| 80  | `p-run-end-1`         | İyi oynadın. Ne öğrendin?              |
| 81  | `p-run-end-2`         | Her seferinde biraz daha ileri.        |
| 82  | `p-run-end-3`         | Zor bölümdü, denedin.                  |
| 83  | `p-run-end-4`         | Dikkatle oynadın.                      |
| 84  | `p-run-end-5`         | Bu sefer neyi farklı yaptın?           |
| 85  | `p-run-end-6`         | Harika bir deneme oldu.                |
| 86  | `p-new-star-1`        | Yeni yıldız! Sabrın kazandı.           |
| 87  | `p-new-star-2`        | Yıldız geldi! Çok denedin.             |
| 88  | `p-new-star-3`        | Bir yıldız daha! Emeğin bu.            |
| 89  | `p-new-star-4`        | Yeni yıldız! Dikkatin işe yaradı.      |
| 90  | `p-persisted-1`       | Üç kere denedin. Bu cesaret.           |
| 91  | `p-persisted-2`       | Vazgeçmedin. İşte bu!                  |
| 92  | `p-persisted-3`       | Tekrar tekrar denedin.                 |
| 93  | `p-persisted-4`       | Bırakmadın, devam ettin.               |
| 94  | `p-chose-hard-1`      | Zor olanı seçtin. Süper.               |
| 95  | `p-chose-hard-2`      | Zoru seçtin. Bu cesaret.               |
| 96  | `p-chose-hard-3`      | Zor olan beyni çalıştırır.             |
| 97  | `p-chose-hard-4`      | Zor bir şey seçtin, deneyelim.         |
| 98  | `p-break-done-1`      | Gözlerin dinlendi. Hadi.               |
| 99  | `p-break-done-2`      | Vücudun uyandı. Devam!                 |
| 100 | `p-break-done-3`      | Dinlendin, şimdi hazırsın.             |
| 101 | `p-break-done-4`      | Güzel mola! Hadi.                      |
| 102 | `p-break-done-5`      | Nefeslendin. Haydi devam.              |
| 103 | `p-day-done-1`        | Bugün çok şey yaptın. Yarın görüşürüz. |
| 104 | `p-day-done-2`        | Bugün çok çalıştın. Yarın görüşürüz.   |
| 105 | `p-day-done-3`        | Güzel bir gündü. Yarın yine!           |
| 106 | `p-day-done-4`        | Bugün çok denedin. Hoşça kal.          |
| 107 | `p-day-done-5`        | Bugünlük bu kadar. Yarın görüşürüz.    |

### 5. Sayılar 0–20 (mola sayımı, `numberClip(n)`)

| #   | Klip   | Metin    |
| --- | ------ | -------- |
| 108 | `n-0`  | Sıfır    |
| 109 | `n-1`  | Bir      |
| 110 | `n-2`  | İki      |
| 111 | `n-3`  | Üç       |
| 112 | `n-4`  | Dört     |
| 113 | `n-5`  | Beş      |
| 114 | `n-6`  | Altı     |
| 115 | `n-7`  | Yedi     |
| 116 | `n-8`  | Sekiz    |
| 117 | `n-9`  | Dokuz    |
| 118 | `n-10` | On       |
| 119 | `n-11` | On bir   |
| 120 | `n-12` | On iki   |
| 121 | `n-13` | On üç    |
| 122 | `n-14` | On dört  |
| 123 | `n-15` | On beş   |
| 124 | `n-16` | On altı  |
| 125 | `n-17` | On yedi  |
| 126 | `n-18` | On sekiz |
| 127 | `n-19` | On dokuz |
| 128 | `n-20` | Yirmi    |

### 6. Ses grubu kelimeleri (`SOUND_GROUPS`, harf başına bir resimli kelime)

Fonem kuralı: harf tek başına okunmaz; her zaman kelime. `ğ` hiçbir zaman ilk ses olarak sorulmaz (kelime sonda).

| #   | Klip        | Harf | Grup    | Metin    |
| --- | ----------- | ---- | ------- | -------- |
| 129 | `w-elma`    | e    | 1. grup | Elma.    |
| 130 | `w-limon`   | l    | 1. grup | Limon.   |
| 131 | `w-arı`     | a    | 1. grup | Arı.     |
| 132 | `w-kedi`    | k    | 1. grup | Kedi.    |
| 133 | `w-inek`    | i    | 1. grup | İnek.    |
| 134 | `w-nar`     | n    | 1. grup | Nar.     |
| 135 | `w-otobüs`  | o    | 2. grup | Otobüs.  |
| 136 | `w-masa`    | m    | 2. grup | Masa.    |
| 137 | `w-uçak`    | u    | 2. grup | Uçak.    |
| 138 | `w-top`     | t    | 2. grup | Top.     |
| 139 | `w-üzüm`    | ü    | 2. grup | Üzüm.    |
| 140 | `w-yıldız`  | y    | 2. grup | Yıldız.  |
| 141 | `w-ördek`   | ö    | 3. grup | Ördek.   |
| 142 | `w-robot`   | r    | 3. grup | Robot.   |
| 143 | `w-ırmak`   | ı    | 3. grup | Irmak.   |
| 144 | `w-deniz`   | d    | 3. grup | Deniz.   |
| 145 | `w-su`      | s    | 3. grup | Su.      |
| 146 | `w-balık`   | b    | 3. grup | Balık.   |
| 147 | `w-zürafa`  | z    | 4. grup | Zürafa.  |
| 148 | `w-çilek`   | ç    | 4. grup | Çilek.   |
| 149 | `w-gemi`    | g    | 4. grup | Gemi.    |
| 150 | `w-şemsiye` | ş    | 4. grup | Şemsiye. |
| 151 | `w-civciv`  | c    | 4. grup | Civciv.  |
| 152 | `w-pasta`   | p    | 4. grup | Pasta.   |
| 153 | `w-havuç`   | h    | 5. grup | Havuç.   |
| 154 | `w-vazo`    | v    | 5. grup | Vazo.    |
| 155 | `w-dağ`     | ğ    | 5. grup | Dağ.     |
| 156 | `w-fil`     | f    | 5. grup | Fil.     |
| 157 | `w-jöle`    | j    | 5. grup | Jöle.    |
