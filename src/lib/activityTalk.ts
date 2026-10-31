/**
 * Her etkinlik için ebeveynin çocuğa sorabileceği tek soru (CONTRACT §10.8).
 * `activityLearning.ts` yalnızca sunucuda çalışır; `/bilgi` bir istemci sayfası
 * olduğu için soruların istemci tarafında güvenli kopyası buradadır. Değerler
 * `ACTIVITY_KNOWLEDGE[slug].talkQuestion` ile birebir aynıdır; bir test eşliği denetler.
 */
export const TALK_QUESTIONS: Record<string, string> = {
  "super-ayi":
    "Ayının daha uzağa atlaması için yalnızca daha yükseğe mi, yoksa ileriye doğru da mı kuvvet uygulamak gerekir?",
  "flappy-bird":
    "Kuş aynı yükseklikte kalabilseydi yukarı ve aşağı etkilerin nasıl olması gerekirdi?",
  tetris:
    "L biçimli bir parçayı dört kez çeyrek tur döndürürsen başladığı görünüme döner mi?",
  pong: "Top raketin tam ortasına değil de üst kenarına çarparsa sence hangi yöne gider?",
  asteroids:
    "Uzayda hava direnci çok azsa gemiyi yavaşlatmak için hangi yöne itiş vermelisin?",
  "tugla-kir":
    "Topu sağdaki bir tuğlaya göndermek için raketin hangi bölümüne çarptırmayı denersin?",
  "pinball-space-cadet":
    "Kanatçığa daha erken ya da daha geç basmak topun yolunu neden değiştirir?",
  "uzay-savunma":
    "Meteor sana doğru gelirken sen de ona yaklaşırsan aradaki uzaklık daha hızlı mı azalır?",
  "yagmur-damlasi":
    "Yere düşen bir yağmur damlası bundan sonra hangi üç farklı yolculuğa çıkabilir?",
  "ziplama-adasi":
    "Karakter en yüksek noktaya ulaştığı anda yukarı doğru hızı hakkında ne söyleyebilirsin?",
  "serit-yarisi":
    "Araç iki kat hızlı giderse aynı engele tepki vermek daha kolay mı, daha zor mu olur?",
  "baloncuk-patlat":
    "Hedeflerin rengi arka plana çok benzese onları bulmak neden daha zor olurdu?",
  "kosu-macera":
    "Koşmaya başlamadan ve koştuktan sonra nefesindeki hangi farkları gözleyebilirsin?",
  "hafiza-kartlari":
    "Kartları yalnızca şekline göre mi, bulunduğu yere göre mi hatırlamak daha kolay; ikisini birlikte kullanınca ne olur?",
  "yilan-oyunu":
    "Yılan uzadıkça neden yalnızca bir sonraki kareyi değil, birkaç hamle sonrasını da düşünmek gerekir?",
  "top-yakala":
    "Daha yukarıdan bırakılan iki aynı nesneden hangisinin yolunu izlemek için daha çok zamanın olur?",
  labirent:
    "Çıkmaz sokağa geldiğinde başlangıca dönmeden yeni bir yol bulmak için hangi işareti hatırlamalısın?",
  "balon-patlat":
    "Bir toplama işleminde sayıların yerini değiştirince toplam neden aynı kalır?",
  "renk-yaris": "Çok loş bir odada renkleri ayırt etmek neden daha zor olabilir?",
  "kaydir-puzzle":
    "Bir hamle hedef parçayı yaklaştırsa da diğerlerini kilitliyorsa gerçekten iyi bir hamle midir?",
  "royal-match":
    "Tek hamlede iki farklı eşleşme oluşturmak için taşların çevresinde hangi düzeni ararsın?",
  "hizli-matematik":
    "7 + 3 = 10 bilgisini kullanarak 10 − 3 işlemini düşünmeden nasıl bulabilirsin?",
  "kelime-avcisi":
    "Bir kelimenin ilk harfi, doğru resmi bulmak için sana nasıl ipucu verir?",
  "hedef-vur": "8 + 5'i önce 8 + 2 + 3 diye düşünmek neden işi kolaylaştırabilir?",
  "blok-dunyasi":
    "Kurduğun yapının iki yanı aynı mı? Aynı olması için hangi bloğu değiştirirsin?",
  "dovus-arenasi":
    "Bir karakter tek ayak üstündeyken mi, iki ayağı yerdeyken mi daha kolay dengede kalır; neden?",
  "tank-savasi":
    "Hedef sağa doğru gidiyorsa atışı doğrudan hedefe mi, biraz önüne mi yapmak daha etkili olur?",
  "uzayli-istilasi":
    "Daha hızlı hareket eden bir hedefi yakalamak için kararını daha erken mi vermelisin?",
  "meyve-bicagi":
    "Kısa ve düz bir hareketle mi, uzun ve kıvrımlı bir hareketle mi daha çok hedefe ulaşırsın?",
  "kostebek-vur":
    "Hangi durumda tepkin yavaşlar: yalnızca tek hedef varken mi, hedefle birlikte kaçınılacak nesneler de varken mi?",
  "harf-tanima":
    "Aynı harfi büyük ve küçük yazınca biçimi değişse de temsil ettiği ses neden aynı kalabilir?",
  "ses-avi": "'Elma' ile 'el' aynı sesle mi başlıyor? Bunu nasıl anladın?",
  "harf-yazma":
    "Harfi yavaş çizdiğinde mi, çok hızlı çizdiğinde mi çizgiye daha kolay yakın kalırsın?",
  "hece-birlestir":
    "Bir kelimedeki ünlüleri bulmak hece sayısını tahmin etmene nasıl yardım eder?",
  "kelime-okuma":
    "Resim olmasaydı kelimenin ilk ve son harfleri sana hangi ipuçlarını verirdi?",
  "sesli-harf":
    "Bir ünsüzü tek başına uzun süre söylemek neden bir ünlüyü uzatmak kadar kolay değildir?",
  "cumle-kur":
    "'Kedi sütü içti' cümlesinde yapanı ve yapılan işi anlatan kelimelerin yerini değiştirirsen anlam nasıl etkilenir?",
  "alfabe-sirasi":
    "Alfabe sırası hiç olmasaydı kalın bir sözlükte aradığın kelimeyi bulmak nasıl olurdu?",
  "benzer-kelime":
    "Bir yarasa hangi özellikleri nedeniyle kuşlarla değil memelilerle aynı grupta yer alır?",
  "bosluk-doldur":
    "Bir boşluğa iki kelime de uyuyor gibi görünürse hangisinin daha doğru olduğuna nasıl karar verirsin?",
  "sayma-oyunu":
    "Nesnelerin yerini değiştirip yeniden saysan miktar neden değişmez?",
  "toplama-oyunu":
    "2 + 5 ile 5 + 2'yi nesnelerle gösterdiğinde sonuçların aynı olduğunu görebilir misin?",
  "cikarma-oyunu":
    "6 − 2 işlemini sayı doğrusunda neden sola doğru adımlarla gösteririz?",
  "sayi-sirasi": "Sayı doğrusunda 4 ile 7 arasında kaç eşit adım vardır?",
  "cift-tek": "Bir çift sayıya bir eklediğinde sonuç neden her zaman tek olur?",
  "onluk-birlik":
    "32 ile 23 aynı rakamları kullandığı hâlde neden farklı miktarları gösterir?",
  "saat-ogren":
    "Yelkovan bir tam tur attığında akrep neden yalnızca bir sayı ilerler?",
  "para-say":
    "10 TL'yi kaç farklı küçük para veya banknot birleşimiyle gösterebilirsin?",
  karsilastir:
    "İki basamaklı sayıları karşılaştırırken önce neden onlar basamağına bakmak işe yarar?",
  "renk-atolyesi":
    "Tamamen karanlık bir odada çok renkli bir oyuncağın renklerini neden göremeyiz?",
  "sekil-tani":
    "Bir kareyi eğik çevirince neden hâlâ dört eşit kenarlı bir kare olarak kalır?",
  "sekil-ciz": "Üçgen çizmek için en az kaç düz çizgiye ve köşeye ihtiyacın var?",
  simetri:
    "Bir şeklin birden fazla simetri doğrusu olabilir mi; kare üzerinde kaç tane bulabilirsin?",
  "desen-tamamla":
    "Kırmızı–mavi–mavi örüntüsünün tekrar birimi nedir ve sekizinci öğe hangi renk olur?",
  "sekil-say":
    "Rengi farklı ama kenar sayısı aynı iki şekli aynı gruba koyar mıydın; ölçütün ne olurdu?",
  tangram:
    "Aynı iki üçgeni birleştirerek hem kareye hem daha büyük bir üçgene benzeyen biçimler yapabilir misin?",
  "dinozor-kazi":
    "Yalnızca bir dinozor dişi bulsaydın ne yediği hakkında hangi tahmini yapabilirdin?",
  "hava-durumu":
    "Sabah ve öğleden sonra gökyüzünü gözlesen hangi özelliklerin değiştiğini kaydedebilirsin?",
  gezegenler:
    "Gezegenlerin Güneş'e uzaklıkları sıcaklıklarını etkiler; peki uzaklık tek başına yeterli bir açıklama mıdır?",
  vucudumuz: "Koşarken kalbin ve nefesin neden aynı anda hızlanır?",
  "besin-gruplari":
    "Tek bir yiyecek yerine farklı besinlerden oluşan bir tabak hazırlamak neden daha iyi olabilir?",
  "bitki-buyume":
    "İki aynı tohumdan biri su almazsa adil bir gözlem için başka hangi koşulları aynı tutmalısın?",
  hayvanlar:
    "Bir kutup hayvanının kalın kürkü çölde neden yarardan çok sorun oluşturabilir?",
  mevsimler: "Türkiye'de yaz yaşanırken Güney Yarımküre'de neden kış olabilir?",
  "su-dongu":
    "Kapalı bir kavanozdaki az miktarda su güneşte beklerse kavanozun içinde hangi değişimleri görebilirsin?",
  "guvenli-yol": "Ekranda seni korkutan bir şey görürsen ne yaparsın?",
  "hazine-haritasi":
    "Haritadaki iki yol aynı yere gidiyorsa hangisinin daha kısa olduğunu nasıl anlayabilirsin?",
  "sira-bul":
    "2, 4, 6 dizisinin bir sonraki sayısı için kuralın ne; aynı ilk üç sayıya uyan başka bir kural bulunabilir mi?",
  "boyut-sirala":
    "En uzun nesne her zaman en ağır nesne midir; bunu nasıl sınardın?",
  "mantik-eslestir":
    "El–eldiven ilişkisine benzeyen ayak–? çiftini hangi sözcük tamamlar ve neden?",
  "fark-bul":
    "Bir fark bulduğunda gördüğün kanıtı 'bence farklı' demeden daha açık nasıl anlatırsın?",
  grupla:
    "Elma, muz ve havucu 'yiyecek' grubunda birlikte tutabilirken daha özel bir ölçütte havuç neden ayrılır?",
  "dur-git":
    "Köpekbalığı geldiğinde elini durdurmak neden zor? Ne yapınca kolaylaşıyor?",
};
