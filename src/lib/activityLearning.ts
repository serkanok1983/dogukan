import "server-only";

import { getTopic } from "./encyclopedia";
import { getGuide } from "./guides";
import { MENU } from "./menu";
import type {
  ActivityKnowledge,
  ActivityLearning,
  ActivityLearningPreviews,
} from "./activityLearning.types";

function knowledge(
  relatedTopicSlug: string,
  term: string,
  idea: string,
  definition: string,
  realLife: string,
  talkQuestion: string,
): ActivityKnowledge {
  return {
    idea,
    concept: { term, definition },
    realLife,
    talkQuestion,
    relatedTopicSlug,
  };
}

/**
 * Oyun ile bilgi arasında kurulan kanıta dayalı köprüler.
 *
 * Bu katalog yalnızca sunucuda çalışır. Dinamik oyun bileşenlerinin bulunduğu
 * istemci paketine 69 uzun metnin tamamı eklenmez; her sayfaya tek kayıt geçer.
 */
const ACTIVITY_KNOWLEDGE: Readonly<Record<string, ActivityKnowledge>> = {
  // Oyunlar
  "super-ayi": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Kuvvet ve yerçekimi",
    "Ayıyı koşturup zıplatırken bir kuvvetin hareketi nasıl başlattığını, yerçekiminin de onu yeniden yere çektiğini keşfediyorsun.",
    "Kuvvet; bir cismin hızını, yönünü ya da biçimini değiştirebilen itme veya çekmedir. Yerçekimi, Dünya'nın cisimleri kendine doğru çekmesidir.",
    "Topu yukarı attığında elin ilk kuvveti verir; top yükselirken yavaşlar ve yerçekimi nedeniyle geri düşer.",
    "Ayının daha uzağa atlaması için yalnızca daha yükseğe mi, yoksa ileriye doğru da mı kuvvet uygulamak gerekir?",
  ),
  "flappy-bird": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Dengelenmeyen kuvvetler",
    "Her dokunuşta kuşu yukarı iten etki ile onu aşağı çeken yerçekimi arasındaki mücadeleyi gözlüyorsun.",
    "Bir cisme etki eden kuvvetler dengeli değilse cismin hızı veya hareket yönü değişir.",
    "Salıncakta doğru anda verdiğin küçük itmeler üst üste eklenir ve daha yükseğe çıkmanı sağlar.",
    "Kuş aynı yükseklikte kalabilseydi yukarı ve aşağı etkilerin nasıl olması gerekirdi?",
  ),
  "dovus-arenasi": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Denge ve kuvvet",
    "Karakterin hareketinde mesafe, denge, yön ve kuvvetin birlikte sonucu nasıl değiştirdiğini inceliyorsun.",
    "Denge, vücudun ağırlık merkezini destek alanı üzerinde tutabilmesidir; kuvvet ise hareketi değiştirebilir.",
    "Top atarken veya zıplarken ayaklarını uygun aralıkta tutmak dengede kalmana yardım eder.",
    "Bir karakter tek ayak üstündeyken mi, iki ayağı yerdeyken mi daha kolay dengede kalır; neden?",
  ),
  tetris: knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Döndürme ve boşluk doldurma",
    "Parçaları zihninde döndürerek hangi biçimin hangi boşluğa uyacağını tahmin ediyorsun.",
    "Bir şekil döndürülünce büyüklüğü ve kenarları değişmez; yalnızca uzaydaki yönü değişir.",
    "Bir çekmeceye farklı biçimli eşyaları düzenli yerleştirirken aynı uzamsal düşünmeyi kullanırsın.",
    "L biçimli bir parçayı dört kez çeyrek tur döndürürsen başladığı görünüme döner mi?",
  ),
  pong: knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Çarpışma ve yön değişimi",
    "Top rakete çarptığında hareket yönünün nasıl değiştiğini ve vuruş noktasının yeni yolu nasıl etkilediğini gözlüyorsun.",
    "Çarpışmada cisimler birbirlerine kuvvet uygular; bu kuvvet hızın büyüklüğünü veya yönünü değiştirebilir.",
    "Futbolda topa ayağının içiyle ya da dışıyla vurmak topu farklı yönlere gönderir.",
    "Top raketin tam ortasına değil de üst kenarına çarparsa sence hangi yöne gider?",
  ),
  asteroids: knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Eylemsizlik",
    "Motoru bıraktıktan sonra geminin kaymayı sürdürmesiyle hareketin kendiliğinden hemen yok olmadığını görüyorsun.",
    "Eylemsizlik, bir cismin duruyorsa durmayı; hareket ediyorsa hareket durumunu koruma eğilimidir.",
    "Bisiklet aniden durduğunda gövdenin öne doğru gitmek istemesi eylemsizliğin günlük bir örneğidir.",
    "Uzayda hava direnci çok azsa gemiyi yavaşlatmak için hangi yöne itiş vermelisin?",
  ),
  "tugla-kir": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Yansıma açısı",
    "Topun raketin farklı noktalarına çarpınca farklı yönlere sekmesini deneyerek açıların hareketi nasıl değiştirdiğini keşfediyorsun.",
    "Bir yüzeye çarpıp seken cismin geliş yönü ile yüzeyin konumu, yeni hareket yönünü belirler.",
    "Bir duvara eğik atılan lastik top, düz atılan topa göre farklı bir yöne seker.",
    "Topu sağdaki bir tuğlaya göndermek için raketin hangi bölümüne çarptırmayı denersin?",
  ),
  "pinball-space-cadet": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Enerji aktarımı",
    "Fırlatıcı ve kanatçıkların topa hareket enerjisi aktardığını, çarpışmaların da bu enerjinin yönünü değiştirdiğini gözlüyorsun.",
    "Hareket enerjisi, hareket eden bir cismin sahip olduğu enerjidir; kuvvet uygulayarak cisme enerji aktarabiliriz.",
    "Bir oyuncak arabayı daha güçlü ittiğinde genellikle daha hızlı ve daha uzağa gider.",
    "Kanatçığa daha erken ya da daha geç basmak topun yolunu neden değiştirir?",
  ),
  "tank-savasi": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Yörünge ve tahmin",
    "Hareketli hedefin ileride nerede olacağını tahmin ederek hız, yön ve zaman arasındaki bağı kullanıyorsun.",
    "Yörünge, hareket eden bir cismin izlediği yoldur. Hız ve yön değişirse bu yol da değişir.",
    "Hareket eden arkadaşına top atarken topu onun bulunduğu yere değil, ulaşacağı yere doğru gönderirsin.",
    "Hedef sağa doğru gidiyorsa atışı doğrudan hedefe mi, biraz önüne mi yapmak daha etkili olur?",
  ),
  "uzay-savunma": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Bağıl hareket",
    "Roket ve meteor aynı anda hareket ederken aralarındaki uzaklığın ne kadar hızlı değiştiğini gözlüyorsun.",
    "Bağıl hareket, bir cismin hareketini başka bir cisme göre anlatmaktır.",
    "Yanındaki araç seninle aynı hızda ilerlerse bir süre durmuş gibi görünebilir.",
    "Meteor sana doğru gelirken sen de ona yaklaşırsan aradaki uzaklık daha hızlı mı azalır?",
  ),
  "uzayli-istilasi": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Hız, yön ve zaman",
    "Hareket eden uzaylıların gelecekteki yerini hesaplar gibi düşünüp doğru anda doğru yöne atış yapıyorsun.",
    "Hız, belirli bir sürede ne kadar yol alındığını; yön ise hareketin nereye doğru olduğunu anlatır.",
    "Yoldan karşıya geçen birini izlerken birkaç saniye sonra nerede olacağını hızına bakarak tahmin edebilirsin.",
    "Daha hızlı hareket eden bir hedefi yakalamak için kararını daha erken mi vermelisin?",
  ),
  "meyve-bicagi": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Hareket yolu",
    "Parmağınla çizdiğin yolun başlangıç, yön ve uzunluğunun hangi nesnelere ulaşacağını nasıl belirlediğini keşfediyorsun.",
    "Bir cismin ya da parmağın hareket ederken izlediği çizgiye hareket yolu denebilir.",
    "Kalemle bir labirentte yol çizerken de yönünü ve hareket mesafeni sürekli ayarlarsın. Gerçek kesici araçlar yalnızca yetişkinler tarafından kullanılmalıdır.",
    "Kısa ve düz bir hareketle mi, uzun ve kıvrımlı bir hareketle mi daha çok hedefe ulaşırsın?",
  ),
  "yagmur-damlasi": knowledge(
    "bir-su-damlasinin-yolculugu",
    "Yağış ve su döngüsü",
    "Düşen damlaları toplarken suyun bulutlardan yeryüzüne döndüğü yağış basamağını canlandırıyorsun.",
    "Yağış, bulutlardaki su damlacıkları veya buz kristalleri yeterince büyüdüğünde yağmur, kar ya da dolu olarak yeryüzüne düşmesidir.",
    "Yağmur suyu toprağa sızabilir, akarsulara karışabilir veya yeniden buharlaşabilir.",
    "Yere düşen bir yağmur damlası bundan sonra hangi üç farklı yolculuğa çıkabilir?",
  ),
  "ziplama-adasi": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Yerçekimi ve düşme",
    "Yükselme, yavaşlama ve düşme sırasını gözleyerek yerçekiminin hareket üzerindeki sürekli etkisini keşfediyorsun.",
    "Dünya'nın çekimi, havaya sıçrayan cisimlerin hızını aşağı yönde değiştirir ve onları yeniden yere getirir.",
    "Seksek oynarken sıçrama kuvvetin seni yukarı taşır, sonra yerçekimiyle kareye geri inersin.",
    "Karakter en yüksek noktaya ulaştığı anda yukarı doğru hızı hakkında ne söyleyebilirsin?",
  ),
  "serit-yarisi": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Hız ve güvenli mesafe",
    "Hız arttıkça karar vermek ve engelden kaçmak için kalan sürenin azaldığını deneyimliyorsun.",
    "Aynı uzaklıkta daha hızlı giden bir cismin hedefe ulaşma süresi daha kısadır; durmak için gereken yol da genellikle uzar.",
    "Bisiklet sürerken önündeki kişiyle arana mesafe koymak beklenmedik bir durumda durman için zaman kazandırır.",
    "Araç iki kat hızlı giderse aynı engele tepki vermek daha kolay mı, daha zor mu olur?",
  ),
  "baloncuk-patlat": knowledge(
    "bes-duyum",
    "Görsel dikkat",
    "Kalabalık bir görüntü içinde hedefi seçerek gözlerinden gelen bilgiyi hızla ayıklamayı deniyorsun.",
    "Seçici dikkat, çevredeki birçok uyaran arasından o anda önemli olana odaklanabilmektir.",
    "Bir rafta aradığın kitabı kapağının rengi ve biçimiyle bulurken görsel dikkatini kullanırsın.",
    "Hedeflerin rengi arka plana çok benzese onları bulmak neden daha zor olurdu?",
  ),
  "kosu-macera": knowledge(
    "kalbim-ve-nefesim",
    "Tepki ve beden hareketi",
    "Engeli görüp doğru anda zıplarken göz, beyin ve kasların kısa bir zincir hâlinde birlikte çalışmasını keşfediyorsun.",
    "Beyin duyu bilgisini değerlendirir, sinirlerle kaslara komut gönderir; hareket sırasında kalp ve solunum da kaslara destek olur.",
    "Gerçek koşuda çalışan kaslar daha çok oksijen ister; bu yüzden kalp atışı ve nefes hızlanır.",
    "Koşmaya başlamadan ve koştuktan sonra nefesindeki hangi farkları gözleyebilirsin?",
  ),
  "hafiza-kartlari": knowledge(
    "bes-duyum",
    "Çalışma belleği",
    "Gördüğün kartın ne olduğunu ve nerede bulunduğunu kısa süre aklında tutarak belleğinin nasıl çalıştığını deniyorsun.",
    "Çalışma belleği, bir işi yaparken gerekli küçük bilgi parçalarını kısa süre zihinde tutmamızı sağlar.",
    "Bir telefon numarasını yazana kadar aklında tutmak veya iki aşamalı yönergeyi uygulamak çalışma belleğini kullanır.",
    "Kartları yalnızca şekline göre mi, bulunduğu yere göre mi hatırlamak daha kolay; ikisini birlikte kullanınca ne olur?",
  ),
  "yilan-oyunu": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Uzamsal planlama",
    "Bir sonraki dönüşü önceden düşünerek dolu ve boş alanların birbirine göre konumunu zihninde düzenliyorsun.",
    "Uzamsal planlama, nesnelerin yerini ve olası hareket yollarını zihinde canlandırarak adım seçmektir.",
    "Kalabalık bir masada bardağı devirmeden elini uzatırken çevrendeki boşlukları hesaba katarsın.",
    "Yılan uzadıkça neden yalnızca bir sonraki kareyi değil, birkaç hamle sonrasını da düşünmek gerekir?",
  ),
  "top-yakala": knowledge(
    "itme-cekme-ve-yuvarlanma",
    "Düşme ve tahmin",
    "Düşen nesnenin hızına ve yönüne bakıp nereye ulaşacağını tahmin ederek sepeti doğru yere taşıyorsun.",
    "Yerçekimi cisimleri aşağı çeker; gözlenen hareket yolu, cismin biraz sonra nerede olacağına ilişkin kanıt verir.",
    "Havaya atılan bir topu yakalarken gözün topun yolunu izler, beynin ellerini buluşma noktasına yönlendirir.",
    "Daha yukarıdan bırakılan iki aynı nesneden hangisinin yolunu izlemek için daha çok zamanın olur?",
  ),
  labirent: knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Konum ve yön",
    "Başlangıç ile hedef arasındaki yolları karşılaştırıp sağ, sol, ileri ve geri gibi konum sözcüklerini kullanıyorsun.",
    "Konum bir şeyin nerede olduğunu, yön ise hareketin hangi tarafa olduğunu anlatır.",
    "Bir haritayla parkta yol bulurken dönemeçleri, işaretleri ve bulunduğun yeri birlikte düşünürsün.",
    "Çıkmaz sokağa geldiğinde başlangıca dönmeden yeni bir yol bulmak için hangi işareti hatırlamalısın?",
  ),
  "balon-patlat": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Toplama",
    "İki miktarı bir araya getirip oluşan toplamı farklı seçenekler arasından buluyorsun.",
    "Toplama, ayrı miktarların birleştirildiğinde kaç ettiğini anlatır; sayı doğrusunda sağa doğru ilerlemekle modellenebilir.",
    "Üç kırmızı ve iki yeşil elmayı aynı sepete koyduğunda toplam beş elma olur.",
    "Bir toplama işleminde sayıların yerini değiştirince toplam neden aynı kalır?",
  ),
  "renk-yaris": knowledge(
    "bes-duyum",
    "Renk algısı",
    "Renk adını gördüğün renkle eşleştirirken gözün ışığı, beynin de bu bilgiyi nasıl anlamlandırdığını keşfediyorsun.",
    "Renk algısı, farklı dalga boylarındaki ışığın gözde algılanıp beyin tarafından renk deneyimine dönüştürülmesidir.",
    "Gün batımında veya farklı lambaların altında aynı nesnenin rengi biraz değişik görünebilir.",
    "Çok loş bir odada renkleri ayırt etmek neden daha zor olabilir?",
  ),
  "kostebek-vur": knowledge(
    "bes-duyum",
    "Tepki süresi",
    "Hedefi görme, karar verme ve parmağını hareket ettirme arasında geçen kısa süreyi deneyimliyorsun.",
    "Tepki süresi, bir uyaranı algıladıktan sonra uygun harekete başlayana kadar geçen süredir.",
    "Düşmekte olan bir cetveli yakalama oyununda göz, beyin ve el aynı hızlı zinciri kullanır.",
    "Hangi durumda tepkin yavaşlar: yalnızca tek hedef varken mi, hedefle birlikte kaçınılacak nesneler de varken mi?",
  ),
  "kaydir-puzzle": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Ardışık problem çözme",
    "Bir parçayı yerine götürmek için önce başka parçaları oynatıp çözümü adımlara bölüyorsun.",
    "Ardışık plan, bir hedefe ulaşmak için işlemleri doğru sıraya koymaktır; her adım sonraki olasılıkları değiştirir.",
    "Dolabın arkasındaki oyuncağa ulaşmak için öndeki nesneleri uygun sırayla kaldırmak aynı düşünme biçimidir.",
    "Bir hamle hedef parçayı yaklaştırsa da diğerlerini kilitliyorsa gerçekten iyi bir hamle midir?",
  ),
  "royal-match": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Örüntü ve sınıflandırma",
    "Aynı özellikteki taşları yan yana getirirken renk, biçim ve konum bakımından örüntüler kuruyorsun.",
    "Örüntü, belirli bir kurala göre düzenlenen veya tekrar eden öğeler bütünüdür.",
    "Çorapları renk ve desene göre eşlemek ya da boncukları sırayla dizmek örüntü kurmaya örnektir.",
    "Tek hamlede iki farklı eşleşme oluşturmak için taşların çevresinde hangi düzeni ararsın?",
  ),
  "hizli-matematik": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Sayı ilişkileri",
    "Toplama ile çıkarmanın birbirini ters yönde tamamlayan işlemler olduğunu hızlı örneklerle fark ediyorsun.",
    "Bir sayıya eklenen miktar aynı miktar çıkarılırsa başlangıç sayısına dönülür; işlemler sayı doğrusunda ters yönlerde ilerler.",
    "Beş basamak çıkıp iki basamak geri inmek, 5 − 2 işlemini hareketle göstermektir.",
    "7 + 3 = 10 bilgisini kullanarak 10 − 3 işlemini düşünmeden nasıl bulabilirsin?",
  ),
  "kelime-avcisi": knowledge(
    "bes-duyum",
    "Görsel simge ve anlam",
    "Bir görseli yazılı kelimeyle eşleştirirken şekilleri yalnızca görmekle kalmayıp onlara anlam bağlıyorsun.",
    "Yazıdaki harfler sesleri temsil eden görsel simgelerdir; harfler birleşince anlam taşıyan kelimeler oluşur.",
    "Durak, çıkış veya tuvalet işaretlerini görüntü ile anlamı eşleştirerek okuruz.",
    "Bir kelimenin ilk harfi, doğru resmi bulmak için sana nasıl ipucu verir?",
  ),
  "hedef-vur": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Zihinden toplama",
    "Miktarları hızlıca birleştirirken sayıları parçalara ayırma ve bildiğin toplamları kullanma yolları geliştiriyorsun.",
    "Zihinden işlem, sonucu kâğıt kullanmadan sayı ilişkilerinden yararlanarak bulmaktır.",
    "Alışverişte iki küçük fiyatın yaklaşık toplamını düşünmek zihinden toplamanın günlük kullanımına örnektir.",
    "8 + 5'i önce 8 + 2 + 3 diye düşünmek neden işi kolaylaştırabilir?",
  ),

  // Okuma ve yazma
  "harf-tanima": knowledge(
    "bes-duyum",
    "Ses–harf ilişkisi",
    "Duyduğun sesi gördüğün işaretle eşleştirerek konuşma sesi ile yazı arasındaki köprüyü kuruyorsun.",
    "Harf, dildeki bir sesi ya da ses grubunu yazıda göstermeye yarayan simgedir.",
    "Bir tabela okurken gözün harfleri görür, beynin onları ses ve anlama dönüştürür.",
    "Aynı harfi büyük ve küçük yazınca biçimi değişse de temsil ettiği ses neden aynı kalabilir?",
  ),
  "harf-yazma": knowledge(
    "bes-duyum",
    "Göz–el eşgüdümü",
    "Bir harfin yolunu izlerken gördüğün biçim ile elinin ince hareketlerini birlikte yönetiyorsun.",
    "Göz–el eşgüdümü, gözün topladığı konum bilgisini elin kontrollü hareketiyle birleştirebilmektir.",
    "Düğme iliklemek, resim boyamak ve kaşık kullanmak da küçük kasların kontrollü çalışmasını gerektirir.",
    "Harfi yavaş çizdiğinde mi, çok hızlı çizdiğinde mi çizgiye daha kolay yakın kalırsın?",
  ),
  "hece-birlestir": knowledge(
    "bes-duyum",
    "Heceleme",
    "Kelimeyi daha küçük ses kümelerine ayırıp yeniden birleştirerek okumanın parçadan bütüne nasıl ilerlediğini keşfediyorsun.",
    "Hece, ağzın tek hareketiyle söylenen ve içinde en az bir ünlü bulunan ses grubudur.",
    "Yeni ve uzun bir kelimeyi okurken onu hecelere ayırmak söylemeyi ve yazmayı kolaylaştırır.",
    "Bir kelimedeki ünlüleri bulmak hece sayısını tahmin etmene nasıl yardım eder?",
  ),
  "kelime-okuma": knowledge(
    "bes-duyum",
    "Akıcı sözcük tanıma",
    "Harfleri tek tek çözmekten bütün kelimeyi tanımaya geçerek görsel bilgi ile anlamı hızla birleştiriyorsun.",
    "Sık karşılaşılan sözcükleri hızlı tanımak, dikkatin daha büyük bölümünü cümlenin anlamına ayırmayı sağlar.",
    "Kitap okudukça sık kullanılan kelimeleri daha çabuk tanır ve hikâyeyi daha rahat izlersin.",
    "Resim olmasaydı kelimenin ilk ve son harfleri sana hangi ipuçlarını verirdi?",
  ),
  "sesli-harf": knowledge(
    "bes-duyum",
    "Ünlü sesler",
    "Harfleri söylerken hava akışını dinleyip ünlü ve ünsüz seslerin ağızda farklı oluştuğunu keşfediyorsun.",
    "Ünlü sesler, konuşma yolunda belirgin bir kapanma olmadan çıkar; Türkçede sekiz ünlü harf vardır.",
    "Şarkı söylerken bir sesi uzatmak için çoğunlukla ünlüleri kullanırız: 'aaa' veya 'ooo' gibi.",
    "Bir ünsüzü tek başına uzun süre söylemek neden bir ünlüyü uzatmak kadar kolay değildir?",
  ),
  "cumle-kur": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Dil örüntüsü",
    "Kelimelerin sırası değiştiğinde cümlenin vurgusunun veya anlaşılırlığının değişebileceğini görüyorsun.",
    "Dil de kurallı örüntüler kullanır; Türkçede kurallı cümlede yüklem çoğunlukla sonda bulunur.",
    "Bir yönergeyi doğru sırayla söylemek, karşıdaki kişinin ne yapacağını daha kolay anlamasını sağlar.",
    "'Kedi sütü içti' cümlesinde yapanı ve yapılan işi anlatan kelimelerin yerini değiştirirsen anlam nasıl etkilenir?",
  ),
  "alfabe-sirasi": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Sıralı sistem",
    "Harflerin ortak kabul edilmiş bir sırada dizilmesinin bilgi bulmayı nasıl kolaylaştırdığını keşfediyorsun.",
    "Sıralı sistem, öğelerin belirlenmiş bir kurala göre art arda yerleştirilmesidir.",
    "Sözlükte kelimeler ve sınıf listesindeki adlar alfabetik sırayla düzenlenebilir.",
    "Alfabe sırası hiç olmasaydı kalın bir sözlükte aradığın kelimeyi bulmak nasıl olurdu?",
  ),
  "benzer-kelime": knowledge(
    "hayvanlar-ve-yasam-alanlari",
    "Sınıflandırma",
    "Kelimeleri ortak özelliklerine göre gruplarken bilim insanlarının canlıları sınıflandırmasına benzeyen bir yöntem kullanıyorsun.",
    "Sınıflandırma, varlıkları ortak ve ayırt edici özelliklerine göre gruplamaktır.",
    "Markette ürünler meyve, sebze, içecek veya temizlik ürünü gibi bölümlere ayrılır.",
    "Bir yarasa hangi özellikleri nedeniyle kuşlarla değil memelilerle aynı grupta yer alır?",
  ),
  "bosluk-doldur": knowledge(
    "bes-duyum",
    "Bağlamdan çıkarım",
    "Eksik kelimeyi çevresindeki ipuçlarından tahmin ederek beynin parçaları nasıl anlamlı bir bütüne tamamladığını keşfediyorsun.",
    "Çıkarım, doğrudan söylenmeyen bir sonucu eldeki ipuçlarından akıl yürüterek bulmaktır.",
    "Birinin şemsiye ve ıslak ayakkabıyla içeri girdiğini görünce dışarıda yağmur yağdığını düşünebilirsin.",
    "Bir boşluğa iki kelime de uyuyor gibi görünürse hangisinin daha doğru olduğuna nasıl karar verirsin?",
  ),

  // Sayılar
  "sayma-oyunu": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Bire bir sayma",
    "Her nesneye yalnızca bir sayı sözcüğü vererek son söylediğin sayının toplam miktarı anlattığını keşfediyorsun.",
    "Bire bir eşleme, sayarken her nesneyi tam bir kez işaretlemek veya zihinde eşleştirmektir.",
    "Masaya kaç tabak gerektiğini bulurken her kişi için bir tabak sayarsın.",
    "Nesnelerin yerini değiştirip yeniden saysan miktar neden değişmez?",
  ),
  "toplama-oyunu": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Parçadan bütün oluşturma",
    "İki grubu bir araya getirirken parçaların toplam bütünü nasıl oluşturduğunu görüyorsun.",
    "Toplama, iki ya da daha fazla miktarı tek bir toplam miktar olarak birleştirir.",
    "Oyuncak kutusundaki dört arabaya iki araba daha koyarsan kutuda altı araba olur.",
    "2 + 5 ile 5 + 2'yi nesnelerle gösterdiğinde sonuçların aynı olduğunu görebilir misin?",
  ),
  "cikarma-oyunu": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Eksiltme ve fark",
    "Bir miktardan parça ayırıp geriye kalanı buluyor, çıkarmanın hem eksiltmeyi hem iki miktar arasındaki farkı anlatabildiğini görüyorsun.",
    "Çıkarma, bir bütünden alınan miktarı veya iki sayı arasındaki farkı bulur.",
    "Sekiz kurabiyenin üçü yenirse kalan kurabiye sayısı 8 − 3 ile bulunur.",
    "6 − 2 işlemini sayı doğrusunda neden sola doğru adımlarla gösteririz?",
  ),
  "sayi-sirasi": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Sayı doğrusu",
    "Sayıları küçükten büyüğe dizerken sayı doğrusunda sağa gittikçe değerlerin büyüdüğünü keşfediyorsun.",
    "Sayı doğrusu, sayıların sırasını ve birbirlerine olan uzaklıklarını bir çizgi üzerinde gösteren modeldir.",
    "Asansör katları veya bir yarışın sıralaması sayıları düzen içinde düşünmemize yardım eder.",
    "Sayı doğrusunda 4 ile 7 arasında kaç eşit adım vardır?",
  ),
  "cift-tek": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "İkişerli gruplama",
    "Nesneleri ikişerli eşleştirip hiç artan kalıp kalmadığına bakarak çift ve tek sayıları ayırt ediyorsun.",
    "Çift sayılar ikişerli gruplandığında artan bırakmaz; tek sayılarda bir nesne eşsiz kalır.",
    "Çorapları çift yaparken tek bir çorap artarsa toplam çorap sayısının tek olduğunu anlarsın.",
    "Bir çift sayıya bir eklediğinde sonuç neden her zaman tek olur?",
  ),
  "onluk-birlik": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Basamak değeri",
    "Bir rakamın bulunduğu yere göre farklı değer taşıdığını, on nesneyi tek bir onluk olarak gruplayabildiğini keşfediyorsun.",
    "Basamak değeri, rakamın sayıda bulunduğu konum nedeniyle aldığı değerdir; 24'te 2 rakamı iki onluğu anlatır.",
    "On çubuğu bir paket yapmak, çok sayıda nesneyi daha hızlı saymayı kolaylaştırır.",
    "32 ile 23 aynı rakamları kullandığı hâlde neden farklı miktarları gösterir?",
  ),
  "saat-ogren": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Zamanı ölçme",
    "Saatteki sayıların ve ibrelerin düzenli hareketini okuyarak zamanı ortak bir ölçüyle anlatmayı öğreniyorsun.",
    "Saat, bir gün içindeki zamanı eşit aralıklara bölerek ölçmemizi sağlayan araçtır.",
    "Okula başlama, yemek ve uyku saatlerini bilmek günlük işleri sıraya koymamıza yardım eder.",
    "Yelkovan bir tam tur attığında akrep neden yalnızca bir sayı ilerler?",
  ),
  "para-say": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Değer ve eşdeğerlik",
    "Farklı paraların üzerindeki sayıların fiziksel büyüklükten değil, ortak kabul edilen değerden söz ettiğini keşfediyorsun.",
    "Eşdeğerlik, görünüşleri farklı iki miktarın aynı değeri temsil edebilmesidir.",
    "İki tane 5 TL ile bir tane 10 TL farklı sayıda banknot olsa da aynı toplam değeri gösterebilir.",
    "10 TL'yi kaç farklı küçük para veya banknot birleşimiyle gösterebilirsin?",
  ),
  karsilastir: knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Büyüklük karşılaştırma",
    "İki sayının sayı doğrusundaki yerlerine bakarak hangisinin daha büyük, küçük veya eşit olduğunu belirliyorsun.",
    "Sayı doğrusunda daha sağda bulunan sayı daha büyüktür; eşit sayılar aynı miktarı temsil eder.",
    "İki alışveriş listesinin toplamını karşılaştırırken hangi listenin daha pahalı olduğunu sayılarla görürsün.",
    "İki basamaklı sayıları karşılaştırırken önce neden onlar basamağına bakmak işe yarar?",
  ),

  // Şekiller ve renkler
  "renk-atolyesi": knowledge(
    "isik-ve-golge",
    "Işık ve renk",
    "Renkleri karıştırıp ayırırken gördüğümüz rengin göze ulaşan ışıkla ilgili olduğunu keşfediyorsun.",
    "Bir cismin rengi, üzerine gelen ışığın hangi bölümünü yansıtıp hangisini soğurduğuyla ilişkilidir.",
    "Beyaz bir tişört renkli bir lambanın altında farklı renkte görünebilir; çünkü göze gelen ışık değişir.",
    "Tamamen karanlık bir odada çok renkli bir oyuncağın renklerini neden göremeyiz?",
  ),
  "sekil-tani": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Geometrik özellik",
    "Şekilleri renklerine veya büyüklüklerine değil; kenar, köşe ve eğri gibi değişmeyen özelliklerine göre tanıyorsun.",
    "Geometrik özellik, bir şekli başka şekillerden ayıran kenar sayısı, köşe sayısı veya eğrilik gibi niteliktir.",
    "Trafik levhalarının biçimleri, uzaktan ve renk tam seçilemeden bile anlamlarını ayırt etmeye yardım eder.",
    "Bir kareyi eğik çevirince neden hâlâ dört eşit kenarlı bir kare olarak kalır?",
  ),
  "sekil-ciz": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Çizgi, kenar ve eğri",
    "Şekilleri çizerken düz çizgi, eğri, başlangıç ve bitiş noktalarının biçimi nasıl oluşturduğunu keşfediyorsun.",
    "Kapalı bir şeklin sınırı düz kenarlardan, eğrilerden veya ikisinin birleşiminden oluşabilir.",
    "Ev planlarında odalar çoğunlukla çizgiler ve basit geometrik biçimlerle gösterilir.",
    "Üçgen çizmek için en az kaç düz çizgiye ve köşeye ihtiyacın var?",
  ),
  simetri: knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Yansıma simetrisi",
    "Bir çizginin iki yanındaki noktaların eşit uzaklıkta ve ayna görüntüsü gibi olup olmadığını inceliyorsun.",
    "Yansıma simetrisinde şeklin bir yarısı simetri doğrusu boyunca katlandığında öteki yarısıyla çakışır.",
    "Kelebek kanatları ve bazı yapraklar yaklaşık yansıma simetrisi gösterir.",
    "Bir şeklin birden fazla simetri doğrusu olabilir mi; kare üzerinde kaç tane bulabilirsin?",
  ),
  "desen-tamamla": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Tekrar birimi",
    "Dizide tekrar eden en küçük parçayı bulup bu kuralı gelecekteki öğeyi tahmin etmek için kullanıyorsun.",
    "Tekrar birimi, bir örüntünün aynı sırayla yeniden başlayan en küçük bölümüdür.",
    "Kilim desenleri, müzik ritimleri ve kaldırım taşları düzenli tekrarlar içerebilir.",
    "Kırmızı–mavi–mavi örüntüsünün tekrar birimi nedir ve sekizinci öğe hangi renk olur?",
  ),
  "sekil-say": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Özelliğe göre gruplama",
    "Kalabalık içindeki şekilleri özelliklerine göre ayırıp her grubu ayrı sayıyorsun.",
    "Bir kümeyi saymadan önce ölçüte göre sınıflandırmak, aynı nesneyi iki kez sayma hatasını azaltabilir.",
    "Oyuncakları kutularına ayırırken arabaları, blokları ve topları ayrı ayrı sayabilirsin.",
    "Rengi farklı ama kenar sayısı aynı iki şekli aynı gruba koyar mıydın; ölçütün ne olurdu?",
  ),
  tangram: knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Parça–bütün ilişkisi",
    "Aynı parçaları döndürüp birleştirerek çok farklı bütünler oluşturulabileceğini keşfediyorsun.",
    "Bir bütün, daha küçük parçaların aralarında boşluk veya üst üste binme olmadan birleşmesiyle modellenebilir.",
    "Mozaiklerde küçük taşlar yan yana gelerek büyük bir resim veya desen oluşturur.",
    "Aynı iki üçgeni birleştirerek hem kareye hem daha büyük bir üçgene benzeyen biçimler yapabilir misin?",
  ),

  // Bilim ve doğa
  "dinozor-kazi": knowledge(
    "hayvanlar-ve-yasam-alanlari",
    "Fosil ve kanıt",
    "Toprak katmanlarında ipucu ararken bilim insanlarının geçmiş canlılar hakkında kanıtlardan nasıl çıkarım yaptığını canlandırıyorsun.",
    "Fosil, geçmişte yaşamış bir canlının kayaçlarda korunmuş kalıntısı veya izidir.",
    "Ayak izi, kemik, diş veya yaprak izi bir canlının biçimi ve yaşamı hakkında farklı kanıtlar sağlayabilir.",
    "Yalnızca bir dinozor dişi bulsaydın ne yediği hakkında hangi tahmini yapabilirdin?",
  ),
  "hava-durumu": knowledge(
    "hava-bugun-nasil",
    "Hava gözlemi",
    "Bulut, rüzgâr, sıcaklık ve yağış gibi kanıtları birlikte değerlendirerek bugünkü hava durumunu anlatıyorsun.",
    "Hava durumu, atmosferin belirli bir yer ve zamandaki kısa süreli koşullarıdır.",
    "Dışarı çıkmadan önce hava durumuna bakmak kıyafet ve etkinlik seçmene yardım eder.",
    "Sabah ve öğleden sonra gökyüzünü gözlesen hangi özelliklerin değiştiğini kaydedebilirsin?",
  ),
  gezegenler: knowledge(
    "gunes-dunya-ve-ay",
    "Güneş sistemi",
    "Gezegenleri karşılaştırırken hepsinin Güneş çevresinde dolandığını, fakat büyüklük ve yapılarının farklı olduğunu keşfediyorsun.",
    "Güneş sistemi; Güneş'i ve kütleçekimiyle onun çevresinde dolanan gezegen, uydu, asteroit ve diğer cisimleri kapsar.",
    "Dünya da gökyüzünde gördüğümüz gezegenler gibi Güneş'in çevresinde hareket eden bir gezegendir.",
    "Gezegenlerin Güneş'e uzaklıkları sıcaklıklarını etkiler; peki uzaklık tek başına yeterli bir açıklama mıdır?",
  ),
  vucudumuz: knowledge(
    "kalbim-ve-nefesim",
    "Organ sistemleri",
    "Organların tek başına değil, vücudun gereksinimlerini karşılamak için birbirleriyle bağlantılı çalıştığını keşfediyorsun.",
    "Organ sistemi, belirli bir görevi gerçekleştirmek için birlikte çalışan organlar topluluğudur.",
    "Kalp kanı pompalar, akciğerler gaz alışverişi yapar; dolaşım bu oksijeni hücrelere taşır.",
    "Koşarken kalbin ve nefesin neden aynı anda hızlanır?",
  ),
  "besin-gruplari": knowledge(
    "kalbim-ve-nefesim",
    "Besin ve enerji",
    "Farklı yiyeceklerin vücudun büyüme, onarım ve enerji gereksinimlerine farklı katkılar yaptığını keşfediyorsun.",
    "Besinler vücuda enerji ve yapı maddeleri sağlar; çeşitli beslenmek farklı besin öğelerini almaya yardım eder.",
    "Hareket eden kaslar enerji kullanır; vücut bu enerjiyi besinlerdeki maddelerden sağlar.",
    "Tek bir yiyecek yerine farklı besinlerden oluşan bir tabak hazırlamak neden daha iyi olabilir?",
  ),
  "bitki-buyume": knowledge(
    "tohumdan-bitkiye",
    "Çimlenme ve fotosentez",
    "Tohumun uygun koşullarda filizlendiğini, büyüyen bitkinin ışık, su ve karbondioksit kullanarak şeker ürettiğini keşfediyorsun.",
    "Çimlenme tohumdaki embriyonun büyümeye başlamasıdır; fotosentez ise bitkinin ışık enerjisiyle şeker üretmesidir.",
    "Pencere önündeki bitkinin ışığa doğru yönelmesi, ışığın büyümedeki önemini gözlemlemene yardım eder.",
    "İki aynı tohumdan biri su almazsa adil bir gözlem için başka hangi koşulları aynı tutmalısın?",
  ),
  hayvanlar: knowledge(
    "hayvanlar-ve-yasam-alanlari",
    "Uyum ve yaşam alanı",
    "Hayvanların vücut özellikleri ve davranışlarının yaşadıkları ortamda beslenme, korunma ve hareket etmelerine yardım ettiğini keşfediyorsun.",
    "Yaşam alanı bir canlının su, besin, barınak ve uygun koşullar bulduğu çevredir.",
    "Balığın solungaçları suda gaz alışverişine, kuşun tüyleri ise uçuş ve ısı korunmasına yardım eder.",
    "Bir kutup hayvanının kalın kürkü çölde neden yarardan çok sorun oluşturabilir?",
  ),
  mevsimler: knowledge(
    "gunes-dunya-ve-ay",
    "Eksen eğikliği ve dolanma",
    "Dünya'nın Güneş çevresinde dolanırken eğik ekseninin farklı yarımkürelere yıl boyunca farklı ışık koşulları oluşturduğunu keşfediyorsun.",
    "Mevsimler, Dünya'nın eksen eğikliği ve Güneş çevresindeki dolanımı nedeniyle oluşur; Güneş'e uzaklık tek başına neden değildir.",
    "Yazın gündüzlerin daha uzun olması, yeryüzünün daha uzun süre ışık enerjisi almasına katkı sağlar.",
    "Türkiye'de yaz yaşanırken Güney Yarımküre'de neden kış olabilir?",
  ),
  "su-dongu": knowledge(
    "bir-su-damlasinin-yolculugu",
    "Hâl değişimi ve döngü",
    "Suyun buharlaşma, yoğunlaşma ve yağışla yeryüzü ile atmosfer arasında dolaştığını; yok olmadığını keşfediyorsun.",
    "Su döngüsü, suyun enerji alıp vererek hâl değiştirdiği ve Dünya üzerinde sürekli yer değiştirdiği süreçler bütünüdür.",
    "Islak çamaşırdaki su havaya karışabilir; soğuk bardak dışındaki damlalar ise havadaki su buharından oluşabilir.",
    "Kapalı bir kavanozdaki az miktarda su güneşte beklerse kavanozun içinde hangi değişimleri görebilirsin?",
  ),

  // Mantık
  "hazine-haritasi": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Harita ve ölçekli konum",
    "Yukarıdan görünüşte işaretleri, yönleri ve göreli uzaklıkları okuyarak gerçek bir alanın küçük modelini kullanıyorsun.",
    "Harita, bir alanın konumlarını ve önemli özelliklerini küçültülmüş simgelerle gösteren modeldir.",
    "Okul krokisi sınıf, merdiven ve çıkışların birbirine göre nerede olduğunu bulmana yardım eder.",
    "Haritadaki iki yol aynı yere gidiyorsa hangisinin daha kısa olduğunu nasıl anlayabilirsin?",
  ),
  "sira-bul": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Kuraldan tahmin",
    "Dizideki değişimi bulup aynı kuralın devam edeceğini varsayarak sıradaki öğeyi tahmin ediyorsun.",
    "Bir örüntü kuralı, öğelerin hangi düzene göre seçildiğini veya değiştiğini açıklar.",
    "Takvimde haftanın günleri ve müzikteki ritimler belirli sıraların tekrarına dayanır.",
    "2, 4, 6 dizisinin bir sonraki sayısı için kuralın ne; aynı ilk üç sayıya uyan başka bir kural bulunabilir mi?",
  ),
  "boyut-sirala": knowledge(
    "sayilar-sifir-ve-sayi-dogrusu",
    "Ölçme ve karşılaştırma",
    "Nesneleri küçükten büyüğe dizerken hangi özelliği karşılaştırdığını açıkça seçmenin önemini keşfediyorsun.",
    "Ölçme, bir özelliği aynı türden bir birimle karşılaştırmaktır; uzunluk ve hacim farklı büyüklüklerdir.",
    "Ayakkabıları numarasına, kalemleri uzunluğuna veya şişeleri alabilecekleri su miktarına göre sıralayabilirsin.",
    "En uzun nesne her zaman en ağır nesne midir; bunu nasıl sınardın?",
  ),
  "mantik-eslestir": knowledge(
    "sekiller-oruntuler-ve-simetri",
    "Benzer ilişki kurma",
    "İki şey arasındaki ilişkiyi bulup aynı ilişkiyi yeni bir çiftte arayarak analoji kuruyorsun.",
    "Analoji, iki ilişki arasındaki benzerliği kullanarak yeni bir bağlantıyı anlamaktır.",
    "Kuş–yuva ilişkisini arı–kovan çiftine benzetmek canlı ile barınağı arasındaki ortak bağı gösterir.",
    "El–eldiven ilişkisine benzeyen ayak–? çiftini hangi sözcük tamamlar ve neden?",
  ),
  "fark-bul": knowledge(
    "bes-duyum",
    "Gözlem ve ayırt etme",
    "Benzer görüntüler arasındaki küçük farklılıkları ararken dikkatli gözlemin yalnızca bakmaktan farklı olduğunu keşfediyorsun.",
    "Bilimsel gözlem, bir şeyi dikkatle inceleyip gördüğümüz özelliği tahminden ayırarak kaydetmektir.",
    "İki yaprağın damarlarını, kenarlarını ve renklerini karşılaştırmak onları tanımaya yardım eder.",
    "Bir fark bulduğunda gördüğün kanıtı 'bence farklı' demeden daha açık nasıl anlatırsın?",
  ),
  grupla: knowledge(
    "hayvanlar-ve-yasam-alanlari",
    "Ölçüte göre sınıflandırma",
    "Nesneleri ortak özelliklerine göre grupluyor ve gruba uymayan öğeyi gerekçesiyle ayırıyorsun.",
    "Sınıflandırma için önce bir ölçüt seçilir; ölçüt değişirse aynı nesne farklı bir gruba girebilir.",
    "Düğmeleri renge göre ayırabileceğin gibi delik sayısına veya büyüklüğüne göre de ayırabilirsin.",
    "Elma, muz ve havucu 'yiyecek' grubunda birlikte tutabilirken daha özel bir ölçütte havuç neden ayrılır?",
  ),
};

const menuSlugs = MENU.flatMap((category) => category.items.map((item) => item.slug));
const missingKnowledge = menuSlugs.filter((slug) => !ACTIVITY_KNOWLEDGE[slug]);
const unknownKnowledge = Object.keys(ACTIVITY_KNOWLEDGE).filter((slug) => !menuSlugs.includes(slug));

if (missingKnowledge.length > 0 || unknownKnowledge.length > 0) {
  throw new Error(
    `Etkinlik bilgi kataloğu menüyle eşleşmiyor. Eksik: ${missingKnowledge.join(", ") || "yok"}; ` +
      `fazla: ${unknownKnowledge.join(", ") || "yok"}.`,
  );
}

function resolveTopic(slug: string) {
  const topic = getTopic(slug);
  if (!topic) throw new Error(`İlgili ansiklopedi konusu bulunamadı: ${slug}`);
  return topic;
}

export function getActivityLearning(slug: string): ActivityLearning {
  const entry = ACTIVITY_KNOWLEDGE[slug];
  if (!entry) throw new Error(`Etkinlik bilgi kartı bulunamadı: ${slug}`);

  const topic = resolveTopic(entry.relatedTopicSlug);
  return {
    ...entry,
    guide: getGuide(slug),
    relatedTopic: {
      slug: topic.slug,
      title: topic.title,
      emoji: topic.emoji,
      summary: topic.summary,
    },
  };
}

export function getActivityLearningPreviews(): ActivityLearningPreviews {
  return Object.fromEntries(
    menuSlugs.map((slug) => {
      const entry = ACTIVITY_KNOWLEDGE[slug];
      const topic = resolveTopic(entry.relatedTopicSlug);
      return [
        slug,
        {
          concept: entry.concept.term,
          relatedTopicSlug: topic.slug,
          relatedTopicTitle: topic.title,
          relatedTopicEmoji: topic.emoji,
        },
      ];
    }),
  );
}
