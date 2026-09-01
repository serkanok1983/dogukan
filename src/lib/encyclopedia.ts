type RawLabMode =
  | "body-beat"
  | "living-world"
  | "weather-water"
  | "space-light"
  | "matter-motion"
  | "magnet"
  | "mathematics";

type RawTopic = {
  slug: string;
  title: string;
  kicker: string;
  icon: string;
  accent: string;
  summary: string;
  bigQuestion: string;
  storySections: {
    title: string;
    body: string;
    wonder: string;
  }[];
  facts: {
    icon: string;
    title: string;
    body: string;
  }[];
  glossary: {
    term: string;
    definition: string;
  }[];
  observation: {
    title: string;
    time: string;
    materials: string[];
    steps: string[];
    safety: string;
    think: string;
  };
  parentNote: string;
  quiz: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  }[];
  labMode: RawLabMode;
  labPrompt: string;
};

export type CategoryId =
  | "ben"
  | "canlilar"
  | "dunya"
  | "uzay"
  | "madde"
  | "hareket"
  | "matematik";

export type EncyclopediaCategory = {
  id: CategoryId;
  title: string;
  emoji: string;
  color: string;
  description: string;
};

export type EncyclopediaQuiz = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type EncyclopediaSource = {
  title: string;
  organization: string;
  url: string;
};

export type EncyclopediaTopic = {
  slug: string;
  category: CategoryId;
  title: string;
  emoji: string;
  bigQuestion: string;
  summary: string;
  readingTime: string;
  sections: { title: string; body: string }[];
  facts: { label: string; value: string; detail: string }[];
  glossary: { term: string; meaning: string }[];
  mission: {
    title: string;
    steps: string[];
    safety?: string;
    parentNote: string;
  };
  quiz: EncyclopediaQuiz[];
  relatedActivities: {
    slug: string;
    title: string;
    emoji: string;
    reason: string;
  }[];
  reviewedAt: string;
  sources: EncyclopediaSource[];
  lab:
    | "senses"
    | "body"
    | "plant"
    | "habitat"
    | "weather"
    | "water"
    | "orbit"
    | "moon"
    | "matter"
    | "light"
    | "motion"
    | "magnet"
    | "number"
    | "shape";
};

export const CATEGORIES: EncyclopediaCategory[] = [
  {
    id: "ben",
    title: "Ben ve vücudum",
    emoji: "🫶",
    color: "#ef476f",
    description: "Duyularımızı, organlarımızı ve bedenimizin şaşırtıcı işleyişini keşfet.",
  },
  {
    id: "canlilar",
    title: "Canlılar dünyası",
    emoji: "🌱",
    color: "#2a9d8f",
    description: "Bitkilerin, hayvanların ve yaşam alanlarının görünmez bağlarını izle.",
  },
  {
    id: "dunya",
    title: "Değişen Dünya",
    emoji: "🌦️",
    color: "#118ab2",
    description: "Hava olaylarından suyun yolculuğuna, gezegenimizin döngülerini çöz.",
  },
  {
    id: "uzay",
    title: "Gökyüzü ve uzay",
    emoji: "🌙",
    color: "#6c63ff",
    description: "Geceyle gündüzün, Güneş'in ve Ay'ın gökyüzündeki öyküsüne katıl.",
  },
  {
    id: "madde",
    title: "Madde ve ışık",
    emoji: "🧊",
    color: "#00b4d8",
    description: "Maddenin hâllerini, ışığı ve gölgelerin nasıl oluştuğunu deneylerle gör.",
  },
  {
    id: "hareket",
    title: "Kuvvet ve hareket",
    emoji: "🛹",
    color: "#fb5607",
    description: "İtme, çekme, sürtünme ve mıknatısların görünmez kuvvetleriyle oyna.",
  },
  {
    id: "matematik",
    title: "Matematik ve örüntüler",
    emoji: "🔢",
    color: "#9c36b5",
    description: "Sayıların dilini, şekillerin özelliklerini ve örüntülerdeki gizli kuralları keşfet.",
  },
];

const topicSources: RawTopic[] = [
  {
    slug: "bes-duyum",
    title: "Beş duyum",
    kicker: "Vücudum • Duyu organları",
    icon: "👀",
    accent: "#ef476f",
    summary:
      "Gözlerin, kulakların, burnun, dilin ve cildin birlikte çalışarak çevrendeki dünyayı beynine anlatır.",
    bigQuestion:
      "Bir portakalı görmeden, yalnızca kokusunu ve dokusunu inceleyerek tanıyabilir misin?",
    storySections: [
      {
        title: "Beyne giden beş ayrı haber yolu",
        body:
          "Göz ışığı, kulak ses titreşimlerini, burun havadaki koku taneciklerini, dil çözünmüş tatları, deri ise dokunma, sıcaklık ve basıncı algılar. Duyu organları bu bilgileri elektriksel sinyallere çevirir. Sinirler sinyalleri çok hızlı biçimde beyne taşır.",
        wonder:
          "Beynin gelen haberleri birleştirir; bu yüzden bir elmayı aynı anda kırmızı, serin, kokulu ve gevrek olarak algılarsın.",
      },
      {
        title: "Gördüğümüz her şey nesnenin kendisi değildir",
        body:
          "Bir cismi görebilmen için ondan yansıyan ışığın gözüne ulaşması gerekir. Karanlıkta gözün sağlam olsa bile yeterli ışık yoksa ayrıntıları seçemezsin. Ses içinse hava gibi titreşimi taşıyan bir ortam gerekir.",
        wonder:
          "Uzay boşluğunda ses yayılmaz; astronotlar birbirleriyle telsiz kullanarak konuşur.",
      },
      {
        title: "Duyular birbirine yardım eder",
        body:
          "Burnun tıkalıyken yemeğin tadı daha silik gelebilir. Çünkü 'lezzet' dediğimiz deneyimin büyük bölümünü koku oluşturur. Görmek de beklentimizi etkiler: Aynı içecek farklı renklerde sunulursa tadını farklı sanabiliriz.",
        wonder:
          "Duyular bazen beyni şaşırtabilir. Bu olaylara duyu yanılsaması denir.",
      },
    ],
    facts: [
      {
        icon: "👅",
        title: "Dil haritası bir efsane",
        body:
          "Tatlı, ekşi, tuzlu, acı ve umami tatlarını dilin yalnızca tek bir bölgesi değil, birçok bölgesi algılar.",
      },
      {
        icon: "👃",
        title: "Koku anıları çağırır",
        body:
          "Koku bilgisi beynin anı ve duygularla ilgili bölgeleriyle yakın çalışır; bir koku seni eski bir güne götürebilir.",
      },
      {
        icon: "🖐️",
        title: "Deri de bir organdır",
        body:
          "Deri vücudumuzun en büyük organıdır; bizi korur ve çevremizle ilgili pek çok dokunma bilgisi toplar.",
      },
    ],
    glossary: [
      {
        term: "Duyu organı",
        definition: "Çevreden gelen belirli uyarıları algılayan vücut bölümü.",
      },
      {
        term: "Uyarı",
        definition: "Işık, ses, koku ya da sıcaklık gibi algılanabilen değişim.",
      },
      {
        term: "Sinir",
        definition: "Vücut ile beyin arasında bilgi taşıyan ince lif demeti.",
      },
      {
        term: "Algı",
        definition: "Beynin duyu bilgilerini yorumlayarak anlam oluşturması.",
      },
    ],
    observation: {
      title: "Gizemli nesne dedektifi",
      time: "10 dakika",
      materials: ["Bez bir torba", "Kaşık", "Silgi", "Mandal gibi 3 güvenli nesne"],
      steps: [
        "Bir yetişkin nesneleri torbaya koysun.",
        "Gözlerini kapatmadan elini torbaya sok ve bir nesneye dokun.",
        "Sertlik, biçim, yüzey ve sıcaklık gibi ipuçlarını sesli söyle.",
        "Tahminini yap, sonra nesneyi çıkarıp gözünle kontrol et.",
      ],
      safety:
        "Torbanın içinde sivri, sıcak, kırılabilir ya da ağza girecek kadar küçük nesne bulunmamalı.",
      think:
        "Nesneyi tanımana en çok hangi dokunma ipucu yardım etti?",
    },
    parentNote:
      "Çocuğun 'beş duyuyu sayması' yerine kanıt göstermesini isteyin: 'Bunu hangi duyunla, hangi ipucundan anladın?' Görme veya işitme farklılığı olan bireylerden söz ederken eksiklik değil, farklı bilgi yolları ve yardımcı teknolojiler üzerinde durun.",
    quiz: [
      {
        question: "Karanlık bir odada ayrıntıları görmek neden zorlaşır?",
        options: [
          "Gözlerimiz hemen kapanır",
          "Cisimlerden yeterli ışık yansımaz",
          "Sesler ışığı engeller",
        ],
        answer: 1,
        explanation:
          "Görmek için bir ışık kaynağından çıkan ışığın cisme çarpıp gözümüze ulaşması gerekir.",
      },
      {
        question: "Burnun tıkalıyken yemeğin lezzeti neden daha az gelebilir?",
        options: [
          "Koku, lezzet algısına yardım eder",
          "Dil çalışmayı bırakır",
          "Kulaklarımız sesi duymaz",
        ],
        answer: 0,
        explanation:
          "Tat tomurcukları temel tatları algılar; kokular da birleşince zengin lezzet deneyimi oluşur.",
      },
      {
        question: "Bir nesnenin pürüzlü olduğunu hangi organınla algılarsın?",
        options: ["Deri", "Burun", "Kulak"],
        answer: 0,
        explanation:
          "Derideki alıcılar yüzey, basınç ve sıcaklık gibi dokunma bilgilerini sinirlere aktarır.",
      },
    ],
    labMode: "body-beat",
    labPrompt: "Duyuları sırayla seç; beynine hangi tür haberin ulaştığını keşfet.",
  },
  {
    slug: "kalbim-ve-nefesim",
    title: "Kalbim ve nefesim",
    kicker: "Vücudum • Dolaşım ve solunum",
    icon: "❤️",
    accent: "#e63946",
    summary:
      "Kalbin kanı pompalar, akciğerlerin havayla gaz alışverişi yapar; birlikte bütün hücrelerine oksijen ulaştırırlar.",
    bigQuestion:
      "Koşmaya başlayınca kalbin ve nefesin neden aynı anda hızlanır?",
    storySections: [
      {
        title: "Durmadan çalışan güçlü pompa",
        body:
          "Kalp göğüs kafesinin içinde, kabaca yumruğun büyüklüğünde kaslı bir organdır. Kasılıp gevşedikçe kanı damarların içine iter. Kan, hücrelere oksijen ve besin maddeleri taşırken oluşan bazı atıkları da uzaklaştırılmak üzere toplar.",
        wonder:
          "Dinlenirken bile kalbin çalışır; çünkü hücrelerin uyurken de enerjiye ve oksijene ihtiyaç duyar.",
      },
      {
        title: "Akciğerlerde görünmez değiş tokuş",
        body:
          "Nefes aldığında hava burun ya da ağızdan soluk borusuna, oradan akciğerlere ulaşır. Akciğerlerdeki çok küçük hava keseciklerinde oksijen kana geçer. Kanda taşınan karbondioksit de ters yönde havaya geçer ve nefes verirken dışarı çıkar.",
        wonder:
          "Burnun havayı süzmeye, ısıtmaya ve nemlendirmeye yardım eder; sakin durumda burundan nefes almak yararlıdır.",
      },
      {
        title: "Hareket edince ekip hızlanır",
        body:
          "Kasların çalışırken daha çok enerji üretir ve daha fazla oksijen kullanır. Beyin bu ihtiyacı fark eder; solunum hızın ve kalp atışın artar. Durup dinlenince ihtiyaç azalır, kalp ve nefes yavaş yavaş eski hızına döner.",
        wonder:
          "Düzenli hareket, kalp ve solunum sisteminin görevini daha verimli yapmasına yardım eder.",
      },
    ],
    facts: [
      {
        icon: "🫀",
        title: "Kalp ortanın biraz solunda",
        body:
          "Kalbin büyük bölümü göğüs kafesinin ortasında, küçük bir bölümü ise sol tarafta yer alır.",
      },
      {
        icon: "🩸",
        title: "Nabız bir ipucudur",
        body:
          "Kalp kanı her pompaladığında atardamarlarda bir basınç dalgası oluşur; bunu bilekte nabız olarak hissedebilirsin.",
      },
      {
        icon: "🫁",
        title: "Diyafram nefese yardım eder",
        body:
          "Akciğerlerin altındaki büyük diyafram kası aşağı inince göğüs boşluğu genişler ve hava içeri girer.",
      },
    ],
    glossary: [
      { term: "Nabız", definition: "Kalp atımlarının damarda hissedilen ritmi." },
      {
        term: "Damar",
        definition: "Kanın vücutta dolaştığı boru biçimli yapılar.",
      },
      {
        term: "Oksijen",
        definition: "Hücrelerin enerji açığa çıkarmada kullandığı gaz.",
      },
      {
        term: "Karbondioksit",
        definition: "Hücrelerde oluşup solukla dışarı verilen gaz.",
      },
    ],
    observation: {
      title: "Hareket öncesi ve sonrası nabız",
      time: "8 dakika",
      materials: ["Saniye gösteren bir saat", "Kâğıt ve kalem"],
      steps: [
        "Beş dakika sakin otur. Bileğinin başparmak tarafına iki parmağını hafifçe koy.",
        "15 saniye boyunca hissettiğin atımları say ve sayıyı yaz.",
        "Bir yetişkin yanında dururken 30 saniye yerinde rahatça yürü.",
        "Yeniden 15 saniyelik nabzını say; iki sonucu karşılaştır.",
      ],
      safety:
        "Baş dönmesi, ağrı ya da nefes darlığı olursa hemen dur ve bir yetişkine söyle. Boyundaki damara bastırma.",
      think:
        "Hareketten sonra sayı değişti mi? Bir dakika dinlenince ne oldu?",
    },
    parentNote:
      "Bu etkinlik tanı koymak için değildir; yalnızca değişimi gözlemletir. Çocuğun sonuçlarını başkalarıyla yarıştırmayın. Sağlık sorusu veya alışılmadık bir belirti varsa bilim sayfası yerine sağlık uzmanına başvurun.",
    quiz: [
      {
        question: "Kalbin temel görevi nedir?",
        options: ["Kanı pompalamak", "Havayı soğutmak", "Yiyecekleri parçalamak"],
        answer: 0,
        explanation:
          "Kalbin kasılması kanı damarlara iter; dolaşan kan hücrelere madde taşır.",
      },
      {
        question: "Koşunca solunumumuz neden hızlanır?",
        options: [
          "Kaslar daha fazla oksijene ihtiyaç duyar",
          "Akciğerler küçülür",
          "Kulaklar daha iyi duysun diye",
        ],
        answer: 0,
        explanation:
          "Çalışan kasların enerji ihtiyacı artar; daha çok oksijen alınır ve oluşan karbondioksit uzaklaştırılır.",
      },
      {
        question: "Nabız bize en doğrudan ne hakkında ipucu verir?",
        options: ["Kalp atışları", "Kemik sayısı", "Mide sıcaklığı"],
        answer: 0,
        explanation:
          "Her kalp atımı damarda hissedilebilen bir basınç dalgası oluşturur.",
      },
    ],
    labMode: "body-beat",
    labPrompt: "Hareket düzeyini değiştir; kalp ve nefes göstergelerinin birlikte nasıl hızlandığını izle.",
  },
  {
    slug: "tohumdan-bitkiye",
    title: "Tohumdan bitkiye",
    kicker: "Canlılar • Bitkilerin yaşamı",
    icon: "🌱",
    accent: "#2a9d8f",
    summary:
      "Küçücük bir tohumun içinde yeni bitkinin başlangıcı ve ilk büyüme günleri için besin deposu bulunur.",
    bigQuestion:
      "Bir tohum, toprağın altında hangi yönün yukarı olduğunu nasıl bulur?",
    storySections: [
      {
        title: "Uyuyan canlı paket",
        body:
          "Tohumun koruyucu kabuğunun içinde embriyo denilen minicik bitki taslağı vardır. Uygun su, sıcaklık ve oksijen geldiğinde çimlenme başlar. Tohum önce su alıp şişer, kabuğu çatlar ve ilk kök dışarı uzanır.",
        wonder:
          "Çoğu tohum çimlenirken başlangıçta ışığa değil; suya, uygun sıcaklığa ve oksijene ihtiyaç duyar.",
      },
      {
        title: "Kök aşağı, gövde yukarı",
        body:
          "Kökler yer çekimine doğru, genç gövde ise çoğunlukla ters yöne büyür. Kök bitkiyi tutar, topraktan su ve mineralleri alır. Gövde yaprakları ışığa taşır ve bitkinin içinde maddelerin taşınmasına yardım eder.",
        wonder:
          "Saksıyı yan çevirsen bile birkaç gün sonra sürgün yeniden yukarı kıvrılabilir.",
      },
      {
        title: "Yaprakta kurulan güneş mutfağı",
        body:
          "Yapraklar ışık enerjisini kullanarak su ve karbondioksitten şeker üretir. Bu olaya fotosentez denir; oksijen de açığa çıkar. Bitki ürettiği şekeri büyümek, yeni yapraklar ve kökler yapmak için kullanır.",
        wonder:
          "Bitkiler besini topraktan hazır almaz; kendi şekerlerini üretir, topraktan ise su ve mineral alır.",
      },
    ],
    facts: [
      {
        icon: "🌰",
        title: "Her tohum aynı değil",
        body:
          "Orkide tohumları toz kadar küçük olabilirken Hindistan cevizi çok büyük bir tohumdur.",
      },
      {
        icon: "☀️",
        title: "Yaprak ışığa yönelir",
        body:
          "Birçok bitkinin sürgünü ışığın geldiği yöne doğru büyüme eğilimi gösterir.",
      },
      {
        icon: "🫘",
        title: "İlk besin yanında",
        body:
          "Fasulyedeki kalın çenekler, genç bitki yaprak açana kadar kullanabileceği besini depolar.",
      },
    ],
    glossary: [
      { term: "Çimlenme", definition: "Tohumdan kök ve sürgünün çıkmaya başlaması." },
      { term: "Embriyo", definition: "Tohum içindeki genç bitki taslağı." },
      {
        term: "Fotosentez",
        definition: "Bitkinin ışıkla su ve karbondioksitten şeker üretmesi.",
      },
      {
        term: "Mineral",
        definition: "Bitkinin topraktan suyla aldığı gerekli maddeler.",
      },
    ],
    observation: {
      title: "Fasulyenin uyanış günlüğü",
      time: "5–7 gün, günde 3 dakika",
      materials: ["Şeffaf kavanoz", "Kâğıt havlu", "2 kuru fasulye", "Su"],
      steps: [
        "Kâğıt havluyu nemlendirip kavanozun içine yerleştir.",
        "Fasulyeleri cam ile havlu arasına, görülebilecek şekilde koy.",
        "Kavanozu aydınlık ama yakıcı olmayan bir yerde tut; havluyu nemli bırak, su içinde yüzdürme.",
        "Her gün kök ve sürgünün uzunluğunu çizerek kaydet.",
      ],
      safety:
        "Deneydeki fasulyeleri yeme. Küf oluşursa kavanozu açmadan bir yetişkinle birlikte çöpe at ve ellerini yıka.",
      think:
        "İlk önce kök mü, sürgün mü çıktı? Kökün yönü günler içinde değişti mi?",
    },
    parentNote:
      "Çocuğa her gün aynı saatte çizim yaptırmak bilimsel karşılaştırmayı güçlendirir. 'Bitkiye yemek verdik' yerine 'su verdik; bitki şekerini ışıkla kendi üretiyor' dilini kullanın.",
    quiz: [
      {
        question: "Çimlenirken fasulyeden genellikle ilk hangi bölüm çıkar?",
        options: ["Kök", "Çiçek", "Meyve"],
        answer: 0,
        explanation:
          "İlk kök su almaya ve genç bitkiyi tutmaya başlar; ardından sürgün gelişir.",
      },
      {
        question: "Bitki şekerini hangi süreçle üretir?",
        options: ["Fotosentez", "Donma", "Erişme"],
        answer: 0,
        explanation:
          "Fotosentezde ışık enerjisi kullanılır; su ve karbondioksitten şeker yapılır.",
      },
      {
        question: "Kökün önemli görevlerinden biri hangisidir?",
        options: [
          "Topraktan su ve mineral almak",
          "Ses üretmek",
          "Güneşi geceye çevirmek",
        ],
        answer: 0,
        explanation:
          "Kökler bitkiyi zemine bağlar; su ve çözünmüş mineralleri alır.",
      },
    ],
    labMode: "living-world",
    labPrompt: "Su ve ışık koşullarını değiştir; sanal fasulyenin günler içindeki gelişimini karşılaştır.",
  },
  {
    slug: "hayvanlar-ve-yasam-alanlari",
    title: "Hayvanlar ve yaşam alanları",
    kicker: "Canlılar • Ekosistem",
    icon: "🦊",
    accent: "#f4a261",
    summary:
      "Her yaşam alanı farklı koşullar sunar; hayvanların vücutları ve davranışları bu koşullarda yaşamalarına yardım eder.",
    bigQuestion:
      "Bir kutup ayısını çöle, bir deveyi kutuplara götürsek neden zorlanırlar?",
    storySections: [
      {
        title: "Bir evden daha fazlası",
        body:
          "Yaşam alanı, canlının su, besin, barınak, uygun sıcaklık ve eş bulduğu çevredir. Orman, çöl, deniz, göl ve çayır farklı yaşam alanlarıdır. Aynı alanda yaşayan canlılar birbirleriyle ve cansız çevreyle ilişki kurar.",
        wonder:
          "Bir ağacın gövdesi bile yosunlar, böcekler, kuşlar ve mantarlar için küçük yaşam alanları oluşturabilir.",
      },
      {
        title: "Uyum sağlayan özellikler",
        body:
          "Ördeğin perdeli ayağı suda itiş sağlar; kutup ayısının kalın yağ tabakası ısı kaybını azaltır; devenin geniş ayakları kuma daha az batmasına yardım eder. Bu kalıtsal özellikler bir canlı istediği için bir anda oluşmaz; nesiller boyunca avantaj sağlayan özellikler yaygınlaşır.",
        wonder:
          "Kamuflaj yalnızca saklanmak için değil, bazı avcıların fark edilmeden yaklaşması için de işe yarar.",
      },
      {
        title: "Besin ağı: görünmez bağlantılar",
        body:
          "Bitkiler güneş enerjisini besine dönüştürür. Otçullar bitkileri, etçiller başka hayvanları tüketir; ayrıştırıcılar ölü maddeleri parçalar. Bir türün azalması, onunla beslenen ya da onun beslediği birçok canlıyı etkileyebilir.",
        wonder:
          "Doğada çoğu canlı yalnızca tek bir besine bağlı değildir; bu yüzden bağlantılar zincirden çok ağa benzer.",
      },
    ],
    facts: [
      {
        icon: "🐪",
        title: "Hörgüçte su yok",
        body:
          "Devenin hörgücünde su değil yağ depolanır; vücudu su kaybını azaltan başka özelliklere de sahiptir.",
      },
      {
        icon: "🦉",
        title: "Gece vardiyası",
        body:
          "Baykuşların büyük gözleri az ışıkta görmeye, özel tüyleri sessiz uçmaya yardım eder.",
      },
      {
        icon: "🪸",
        title: "Mercan bir hayvandır",
        body:
          "Mercan resiflerini oluşturan küçük polipler hayvandır ve çok sayıda deniz canlısına yaşam alanı sağlar.",
      },
    ],
    glossary: [
      {
        term: "Yaşam alanı",
        definition: "Canlının ihtiyaçlarını karşıladığı doğal çevre.",
      },
      {
        term: "Uyum (adaptasyon)",
        definition: "Bir canlının yaşama ve üremesine yardım eden kalıtsal özellik.",
      },
      {
        term: "Kamuflaj",
        definition: "Canlının çevresine benzer görünerek fark edilmesini zorlaştırması.",
      },
      {
        term: "Besin ağı",
        definition: "Canlılar arasındaki çok yönlü beslenme bağlantıları.",
      },
    ],
    observation: {
      title: "Pencereden yaşam alanı haritası",
      time: "15 dakika",
      materials: ["Kâğıt", "Kalem", "Pencere, balkon ya da park manzarası"],
      steps: [
        "Güvenli bir noktadan çevreni beş dakika sessizce izle.",
        "Gördüğün bitki ve hayvanları, izlerini ya da duyduğun sesleri kaydet.",
        "Su, besin ve barınak sağlayabilecek yerleri haritana ekle.",
        "İki canlı arasında olası bir bağlantı çiz.",
      ],
      safety:
        "Yabani hayvanlara yaklaşma, dokunma veya yiyecek verme. Balkonda mutlaka yetişkinle çalış.",
      think:
        "Gözlemlediğin alanı hangi küçük değişiklik daha canlı dostu yapabilir?",
    },
    parentNote:
      "Hayvanları 'iyi-kötü' diye sınıflandırmak yerine ekosistemdeki işlevlerini konuşun. Sokak ve yabani hayvanlarla güvenli mesafeyi koruyun; gözlem için yuva bozmayın, canlı toplamaya teşvik etmeyin.",
    quiz: [
      {
        question: "Yaşam alanı canlıya neler sağlar?",
        options: [
          "Su, besin ve barınak gibi ihtiyaçlar",
          "Yalnızca oyun alanı",
          "Her zaman aynı sıcaklık",
        ],
        answer: 0,
        explanation:
          "Bir yaşam alanının uygun olabilmesi için canlının temel ihtiyaçlarını karşılaması gerekir.",
      },
      {
        question: "Ördeğin perdeli ayağı neye yardım eder?",
        options: ["Suda ilerlemeye", "Uçarken görünmez olmaya", "Toprağı ısıtmaya"],
        answer: 0,
        explanation:
          "Parmaklar arasındaki perde, ayağın suyu daha geniş bir yüzeyle itmesini sağlar.",
      },
      {
        question: "Besin ağı neden zincirden daha gerçekçi bir modeldir?",
        options: [
          "Canlılar arasında birden fazla beslenme bağı vardır",
          "Bütün canlılar yalnızca bitki yer",
          "Ağlar yalnızca denizde bulunur",
        ],
        answer: 0,
        explanation:
          "Bir tür çoğunlukla birden çok türle beslenir ve birden çok canlıya besin olabilir.",
      },
    ],
    labMode: "living-world",
    labPrompt: "Canlıları uygun yaşam alanına yerleştir; her eşleşmenin hangi özelliğe dayandığını gör.",
  },
  {
    slug: "hava-bugun-nasil",
    title: "Hava bugün nasıl?",
    kicker: "Dünya • Hava olayları",
    icon: "🌦️",
    accent: "#4cc9f0",
    summary:
      "Sıcaklık, rüzgâr, bulut ve yağış gökyüzünün o anki öyküsünü; yani hava durumunu oluşturur.",
    bigQuestion:
      "Gökyüzüne bakarak birkaç saat sonra yağmur yağıp yağmayacağına dair kanıt toplayabilir misin?",
    storySections: [
      {
        title: "Hava durumu bir anlık fotoğraftır",
        body:
          "Hava durumu belirli bir yerde ve zamanda atmosferin durumudur. Sıcaklık, rüzgâr, nem, hava basıncı, bulutluluk ve yağış ölçülür. Meteorologlar yeryüzü istasyonlarından, balonlardan, radarlardan ve uydulardan gelen verileri birlikte inceler.",
        wonder:
          "İstanbul'un bir ilçesinde yağmur yağarken aynı anda başka bir ilçesi kuru olabilir.",
      },
      {
        title: "Rüzgâr neden eser?",
        body:
          "Güneş yeryüzünü her yerde eşit ısıtmaz. Isınan hava genleşir ve yoğunluğu azalır; çevredeki daha serin hava onun yerini almaya yönelir. Büyük ölçekte hava basıncı farkları havayı hareket ettirir, bu harekete rüzgâr deriz.",
        wonder:
          "Rüzgârın adı çoğunlukla geldiği yöne göre söylenir: kuzey rüzgârı kuzeyden gelir.",
      },
      {
        title: "Buluttan düşen su",
        body:
          "Havadaki su buharı soğuyup küçük su damlacıklarına ya da buz kristallerine yoğunlaşınca bulutlar oluşur. Damlalar birleşip hava akımlarının taşıyamayacağı kadar ağırlaştığında yağmur, kar ya da dolu olarak düşebilir.",
        wonder:
          "Bulutun beyaz ya da gri görünmesi, içindeki damlacıkların ışığı nasıl saçtığı ve bulutun kalınlığıyla ilgilidir.",
      },
    ],
    facts: [
      {
        icon: "🌡️",
        title: "Gölgede ölçülür",
        body:
          "Hava sıcaklığı, doğrudan Güneş'in termometreyi ısıtmaması için hava alan, gölgeli bir yerde ölçülür.",
      },
      {
        icon: "☁️",
        title: "Bulut ağır olabilir",
        body:
          "Orta boy bir kümülüs bulutu çok büyük miktarda su içerebilir; minik damlalar geniş hacme dağılmıştır.",
      },
      {
        icon: "⚡",
        title: "Önce şimşek",
        body:
          "Işık sesten çok daha hızlı ilerlediği için uzaktaki fırtınada önce şimşeği görür, sonra gök gürültüsünü duyarız.",
      },
    ],
    glossary: [
      {
        term: "Atmosfer",
        definition: "Dünya'yı saran gaz tabakası.",
      },
      { term: "Meteorolog", definition: "Hava olaylarını inceleyen bilim insanı." },
      {
        term: "Nem",
        definition: "Havadaki su buharı miktarını anlatan ölçü.",
      },
      {
        term: "Yoğunlaşma",
        definition: "Gaz hâlindeki maddenin sıvı hâle geçmesi.",
      },
    ],
    observation: {
      title: "Üç günlük hava gözlemcisi",
      time: "3 gün, günde 5 dakika",
      materials: ["Kâğıt", "Boya kalemleri", "Dışarıyı güvenle gören bir pencere"],
      steps: [
        "Her gün aynı saatte gökyüzünün ne kadarının bulutlu olduğunu tahmin et.",
        "Ağaç yapraklarına bakıp rüzgârı 'yok, hafif, güçlü' diye kaydet.",
        "Yağış ve nasıl hissettirdiğini not et; hava sıcaklığını güvenilir bir kaynaktan ekle.",
        "Üç günün çizimlerini yan yana getirip değişimleri anlat.",
      ],
      safety:
        "Fırtına ve yıldırım sırasında dışarı çıkma; kapalı bir yapıda kal ve pencereden uzak dur.",
      think:
        "Hangi ölçüm en çok değişti? Tek gözlemle yarının havasını kesin söyleyebilir misin?",
    },
    parentNote:
      "Hava durumu ile iklimi ayırın: hava kısa süreli, iklim uzun yılların örüntüsüdür. Çocuğun tahminini 'doğru-yanlış' yerine kanıtlarıyla değerlendirin. Resmî kuvvetli hava uyarılarını her zaman ciddiye alın.",
    quiz: [
      {
        question: "Hava durumu neyi anlatır?",
        options: [
          "Belirli yer ve zamandaki atmosfer koşullarını",
          "Bir bölgenin binlerce yıllık kaya yapısını",
          "Dünya'nın Güneş'e uzaklığını",
        ],
        answer: 0,
        explanation:
          "Sıcaklık, rüzgâr, nem, bulut ve yağış gibi o anki koşullar hava durumudur.",
      },
      {
        question: "Bulutlar nasıl oluşur?",
        options: [
          "Su buharı soğuyup damlacık veya buz kristaline dönüşünce",
          "Gökyüzü boyanınca",
          "Rüzgâr tamamen durunca",
        ],
        answer: 0,
        explanation:
          "Yükselen nemli hava soğuyabilir; su buharı küçük damlalara veya buz kristallerine yoğunlaşır.",
      },
      {
        question: "Neden önce şimşeği görürüz?",
        options: [
          "Işık sesten daha hızlıdır",
          "Kulaklarımız gözümüzden uzaktadır",
          "Gök gürültüsü sonradan oluşur",
        ],
        answer: 0,
        explanation:
          "Şimşek ve gök gürültüsü aynı olayın parçalarıdır; fakat ışık bize sesten çok daha çabuk ulaşır.",
      },
    ],
    labMode: "weather-water",
    labPrompt: "Sıcaklık ve nemi değiştir; hangi koşulda bulut ve yağış oluştuğunu gözle.",
  },
  {
    slug: "bir-su-damlasinin-yolculugu",
    title: "Bir su damlasının yolculuğu",
    kicker: "Dünya • Su döngüsü",
    icon: "💧",
    accent: "#118ab2",
    summary:
      "Su; deniz, hava, bulut, toprak ve canlılar arasında durmadan dolaşır, hâl değiştirir ama kaybolmaz.",
    bigQuestion:
      "Bugün içtiğin su, çok uzun zaman önce bir dinozorun çevresinde bulunmuş olabilir mi?",
    storySections: [
      {
        title: "Güneş yolculuğu başlatır",
        body:
          "Güneş deniz, göl ve topraktaki suya enerji verir. Yeterli enerji alan bazı su tanecikleri sıvıdan ayrılıp görünmez su buharı olarak havaya karışır; buna buharlaşma denir. Bitkiler de yapraklarından havaya su verir.",
        wonder:
          "Su buharı görünmezdir. Kaynayan tencerenin üstündeki beyaz sis, soğuyup yeniden minicik damlalara dönüşmüş sudur.",
      },
      {
        title: "Gökteki dönüşüm",
        body:
          "Nemli hava yükselirken soğuyabilir. Su buharı, havadaki çok küçük toz veya tuz parçacıklarının çevresinde yoğunlaşarak damlacıklar ve buz kristalleri oluşturur. Milyarlarcası bir araya geldiğinde bulut görürüz.",
        wonder:
          "Bir buluttaki damlalar çok küçüktür; hava akımları onları bir süre yukarıda tutabilir.",
      },
      {
        title: "Yeryüzüne dönüş ve yeniden başlangıç",
        body:
          "Damlalar büyüyünce yağış olarak düşer. Su toprağa sızıp yer altı suyuna karışabilir, akarsularla denize taşınabilir, buzullarda depolanabilir ya da canlıların vücuduna girebilir. Sonra döngü yeniden sürer.",
        wonder:
          "Dünya'daki su miktarı büyük ölçüde aynı kalsa da temiz ve kolay ulaşılabilen tatlı su sınırlıdır.",
      },
    ],
    facts: [
      {
        icon: "🌊",
        title: "Çoğu su tuzlu",
        body:
          "Dünya suyunun çok büyük bölümü okyanuslarda tuzlu sudur; kullanılabilir tatlı su bunun küçük bir bölümüdür.",
      },
      {
        icon: "🌿",
        title: "Bitkiler de su salar",
        body:
          "Yapraklardan su buharının çıkmasına terleme denir ve su döngüsüne katkı sağlar.",
      },
      {
        icon: "🏔️",
        title: "Su uzun süre bekleyebilir",
        body:
          "Bir su taneciği atmosferde günler, buzulda ise çok daha uzun süre kalabilir.",
      },
    ],
    glossary: [
      {
        term: "Buharlaşma",
        definition: "Sıvı suyun su buharına dönüşüp havaya karışması.",
      },
      {
        term: "Yoğunlaşma",
        definition: "Su buharının soğuyup sıvı damlacıklarına dönüşmesi.",
      },
      { term: "Yağış", definition: "Suyun yağmur, kar veya dolu olarak düşmesi." },
      {
        term: "Yer altı suyu",
        definition: "Toprağın ve kayaların boşluklarında biriken su.",
      },
    ],
    observation: {
      title: "Poşette mini su döngüsü",
      time: "20 dakika + bekleme",
      materials: ["Kilitli şeffaf poşet", "2 yemek kaşığı su", "Bant", "Güneş alan pencere"],
      steps: [
        "Suyu poşete koyup ağzını iyice kapat.",
        "Poşeti yetişkin yardımıyla pencereye bantla.",
        "Bir süre sonra içerideki buğuyu ve damlaları incele.",
        "Poşetin üst ve alt bölümlerinde gördüklerini çiz.",
      ],
      safety:
        "Poşeti başına geçirme, suyu içme. Pencereye uzanma ve sıcak cam yüzeyine dokunma; kurulumu yetişkin yapsın.",
      think:
        "Poşetteki su dışarı çıkmadığı hâlde damlalar neden farklı yerlerde belirdi?",
    },
    parentNote:
      "Modelin Dünya'nın su döngüsünü küçülterek temsil ettiğini, rüzgâr, yer altı suyu ve canlılar gibi her ayrıntıyı göstermediğini vurgulayın. Su tasarrufunu korkuyla değil, erişilebilir temiz tatlı suyun sınırlılığıyla açıklayın.",
    quiz: [
      {
        question: "Buharlaşma sırasında ne olur?",
        options: [
          "Sıvı su, su buharına dönüşür",
          "Su tamamen yok olur",
          "Su yalnızca buza dönüşür",
        ],
        answer: 0,
        explanation:
          "Su tanecikleri enerji alıp sıvı yüzeyinden ayrılır; gaz hâlinde havaya karışır.",
      },
      {
        question: "Buluttaki küçük damlalar nereden gelir?",
        options: [
          "Su buharının yoğunlaşmasından",
          "Güneşin parçalanmasından",
          "Yalnızca uçaklardan",
        ],
        answer: 0,
        explanation:
          "Yükselip soğuyan havadaki su buharı küçük parçacıkların çevresinde yoğunlaşabilir.",
      },
      {
        question: "Su döngüsünün ana enerji kaynağı nedir?",
        options: ["Güneş", "Ay", "Toprak"],
        answer: 0,
        explanation:
          "Güneş'in enerjisi buharlaşmayı ve döngüyü yürüten atmosfer hareketlerini destekler.",
      },
    ],
    labMode: "weather-water",
    labPrompt: "Bir damlayı denizden buluta, yağıştan yer altına taşı; her durakta hâlini izle.",
  },
  {
    slug: "gece-ve-gunduz",
    title: "Gece ve gündüz",
    kicker: "Uzay • Dünya'nın hareketi",
    icon: "🌗",
    accent: "#6c63ff",
    summary:
      "Dünya kendi ekseni çevresinde dönerken bir yüzü Güneş'e bakar, öteki yüzü gölgede kalır.",
    bigQuestion:
      "Güneş gerçekten gökyüzünde Dünya'nın çevresinde mi dolaşıyor, yoksa hareket eden biz miyiz?",
    storySections: [
      {
        title: "Dönen dev küre",
        body:
          "Dünya, kutuplarından geçtiğini düşündüğümüz eksen adlı çizgi çevresinde batıdan doğuya döner. Bir tam dönüş yaklaşık 24 saat sürer. Güneş'e dönük taraf aydınlık gündüzü, ters taraf karanlık geceyi yaşar.",
        wonder:
          "Dünya saatte çok yüksek hızla dönse de biz, hava ve çevremizdeki her şey birlikte hareket ettiği için bunu doğrudan hissetmeyiz.",
      },
      {
        title: "Gökyüzünün görünür yolculuğu",
        body:
          "Dünya doğuya döndüğü için Güneş'i, Ay'ı ve yıldızları doğudan yükselip batıya ilerliyormuş gibi görürüz. Buna görünür hareket denir. Bir gölgeyi gün boyunca izlemek, Dünya'nın dönüşünün etkisini fark etmenin yollarından biridir.",
        wonder:
          "Güneş doğarken ve batarken ufka yakın görünür; aslında çoğunlukla hareket eden gözlem yerimizdir.",
      },
      {
        title: "Aynı anda farklı saatler",
        body:
          "Dünya'nın yalnızca bir yarısı aynı anda Güneş'e dönüktür. Türkiye'de öğle iken Dünya'nın başka bir yerinde gece olabilir. Bu nedenle yeryüzü saat dilimlerine ayrılmıştır.",
        wonder:
          "Kutuplara yakın yerlerde yılın bazı dönemlerinde çok uzun gündüzler veya geceler yaşanabilir; bunda eksen eğikliği de rol oynar.",
      },
    ],
    facts: [
      {
        icon: "🌍",
        title: "Dönüş yönü",
        body:
          "Kuzey Kutbu'nun üzerinden bakılsaydı Dünya saat yönünün tersine dönüyor görünürdü.",
      },
      {
        icon: "🕛",
        title: "Güneş günü",
        body:
          "Günlük yaşamda kullandığımız yaklaşık 24 saat, Güneş'in gökyüzünde benzer konuma dönmesiyle ilişkilidir.",
      },
      {
        icon: "🌅",
        title: "Tan vakti",
        body:
          "Güneş doğmadan önce atmosferin saçtığı ışık gökyüzünü aydınlatmaya başlar.",
      },
    ],
    glossary: [
      {
        term: "Eksen",
        definition: "Bir cismin çevresinde döndüğü varsayımsal çizgi.",
      },
      { term: "Dönme", definition: "Bir cismin kendi ekseni çevresindeki hareketi." },
      {
        term: "Görünür hareket",
        definition: "Gözlemcinin hareketi nedeniyle başka bir şey hareket ediyormuş gibi görünmesi.",
      },
      {
        term: "Saat dilimi",
        definition: "Benzer yerel saati kullanan yeryüzü bölgesi.",
      },
    ],
    observation: {
      title: "Fenerle gece-gündüz modeli",
      time: "10 dakika",
      materials: ["El feneri", "Portakal veya top", "Küçük etiket"],
      steps: [
        "Etiketi topun üzerine yaşadığın yeri gösterecek biçimde yapıştır.",
        "Karanlıklaştırılmış odada feneri sabit tut; fener Güneş'i temsil etsin.",
        "Topu yavaşça kendi çevresinde döndür.",
        "Etiket aydınlığa girerken ve gölgeye geçerken ne olduğunu anlat.",
      ],
      safety:
        "Feneri göze tutma. Karanlık odada yürürken yerde takılacak eşya bırakma.",
      think:
        "Modelde gündüzü oluşturan fenerin dolaşması mı, topun dönmesi mi?",
    },
    parentNote:
      "Model kurarken temsil sınırlarını konuşun: Portakal Dünya kadar yuvarlak olabilir ama boyut, uzaklık ve dönüş hızı ölçekli değildir. 'Güneş doğuyor' günlük dilde doğrudur; bilimsel açıklamada görünür hareketin kaynağı Dünya'nın dönüşüdür.",
    quiz: [
      {
        question: "Gece ve gündüzün temel nedeni nedir?",
        options: [
          "Dünya'nın kendi ekseni çevresinde dönmesi",
          "Ay'ın her gece ışığı kapatması",
          "Bulutların Güneş'i taşıması",
        ],
        answer: 0,
        explanation:
          "Dönen Dünya'nın Güneş'e bakan yüzünde gündüz, ters yüzünde gece yaşanır.",
      },
      {
        question: "Dünya bir tam dönüşünü yaklaşık ne kadar sürede tamamlar?",
        options: ["24 saat", "7 gün", "365 gün"],
        answer: 0,
        explanation:
          "Günlük gece-gündüz döngümüz Dünya'nın yaklaşık 24 saatlik dönüşüyle ilişkilidir.",
      },
      {
        question: "Güneş neden doğudan batıya gidiyor gibi görünür?",
        options: [
          "Dünya batıdan doğuya döndüğü için",
          "Güneş her gün Dünya'nın çevresini dolaştığı için",
          "Rüzgâr Güneş'i ittiği için",
        ],
        answer: 0,
        explanation:
          "Biz Dünya ile doğuya doğru dönerken uzaktaki gök cisimleri ters yönde ilerliyormuş gibi görünür.",
      },
    ],
    labMode: "space-light",
    labPrompt: "Dünya modelini döndür; seçtiğin şehrin gündüzden geceye geçişini izle.",
  },
  {
    slug: "gunes-dunya-ve-ay",
    title: "Güneş, Dünya ve Ay",
    kicker: "Uzay • Göksel komşularımız",
    icon: "☀️",
    accent: "#ffb703",
    summary:
      "Güneş bir yıldız, Dünya onun çevresinde dolanan bir gezegen, Ay ise Dünya'nın doğal uydusudur.",
    bigQuestion:
      "Ay kendi ışığını üretmiyorsa geceleri neden bazen parlak bir daire gibi görünür?",
    storySections: [
      {
        title: "Üçü de bambaşka",
        body:
          "Güneş çok sıcak gaz benzeri plazmadan oluşan bir yıldızdır ve kendi ışığını üretir. Dünya kayalık bir gezegendir; Güneş'in çevresinde dolanır. Ay da kayalık bir gök cismidir ve Dünya'nın doğal uydusudur.",
        wonder:
          "Güneş, Ay'dan yaklaşık 400 kat daha geniştir; fakat yaklaşık 400 kat daha uzakta olduğu için gökyüzünde benzer büyüklükte görünebilirler.",
      },
      {
        title: "Ay'ın değişen yüzü",
        body:
          "Güneş, Ay'ın her zaman yarısını aydınlatır. Ay Dünya'nın çevresinde dolandıkça aydınlık yarının farklı bölümlerini görürüz. Hilal, ilk dördün, dolunay ve son dördün gibi evrelere bu bakış açısı yol açar; Dünya'nın gölgesi değil.",
        wonder:
          "Ay'ın evre döngüsü yaklaşık 29,5 gün sürer; her gece biraz farklı görünmesinin nedeni hareketidir.",
      },
      {
        title: "Kütle çekimiyle bağlı bir aile",
        body:
          "Güneş'in kütle çekimi Dünya'yı yörüngesinde, Dünya'nın kütle çekimi de Ay'ı kendi yörüngesinde tutar. Ay'ın çekimi Dünya okyanuslarındaki gelgitlerin başlıca nedenidir. Üç cisim aynı doğrultuya çok yakın geldiğinde tutulmalar yaşanabilir.",
        wonder:
          "Her ay tutulma olmaz; çünkü Ay'ın yörüngesi Dünya'nın Güneş çevresindeki yörünge düzlemine göre biraz eğiktir.",
      },
    ],
    facts: [
      {
        icon: "⭐",
        title: "Güneş de bir yıldız",
        body:
          "Bize en yakın yıldız Güneş'tir; diğer yıldızlar çok uzakta oldukları için küçük ışık noktaları görünür.",
      },
      {
        icon: "🌕",
        title: "Ay'ın uzak yüzü",
        body:
          "Ay'ın dönüş ve dolanma süreleri yaklaşık eşit olduğundan Dünya'dan çoğunlukla aynı yüzünü görürüz.",
      },
      {
        icon: "🌊",
        title: "Gelgit ortak bir sonuç",
        body:
          "Ay'ın çekimi daha güçlü etki yapsa da Güneş'in kütle çekimi de gelgitleri etkiler.",
      },
    ],
    glossary: [
      { term: "Yıldız", definition: "Kendi enerjisini ve ışığını üreten gök cismi." },
      { term: "Gezegen", definition: "Bir yıldızın çevresinde dolanan büyük gök cismi." },
      { term: "Uydu", definition: "Bir gezegenin çevresinde dolanan gök cismi." },
      { term: "Yörünge", definition: "Bir gök cisminin diğerinin çevresinde izlediği yol." },
    ],
    observation: {
      title: "Ay evresi günlüğü",
      time: "Bir hafta, günde 3 dakika",
      materials: ["Kâğıt", "Kurşun kalem", "Güvenli bir gözlem noktası"],
      steps: [
        "Bir hafta boyunca mümkünse aynı saatte Ay'ı ara.",
        "Gökyüzündeki yerini ve aydınlık bölümünün biçimini çiz.",
        "Bulutluysa 'gözlenemedi' yaz; tahmin ederek doldurma.",
        "Çizimleri sıralayıp aydınlık bölümdeki değişimi anlat.",
      ],
      safety:
        "Gece gözlemini bir yetişkinle yap. Asla Güneş'e doğrudan veya optik araçla bakma.",
      think:
        "Aydınlık şekil her gün aynı mı? Ay'ı her gün aynı saatte bulabildin mi?",
    },
    parentNote:
      "Ay evrelerini tutulmayla karıştırmamak ana hedeftir. Bir topu fenerle aydınlatarak 'her zaman yarısı aydınlık' fikrini gösterin. Güneş gözlemi için yalnızca onaylı özel filtreler gerekir; sıradan gözlük veya film güvenli değildir.",
    quiz: [
      {
        question: "Hangisi kendi ışığını üretir?",
        options: ["Güneş", "Dünya", "Ay"],
        answer: 0,
        explanation:
          "Güneş bir yıldızdır ve içindeki enerji süreçleriyle ışık üretir; Dünya ve Ay ışığı yansıtır.",
      },
      {
        question: "Ay'ın evrelerinin nedeni nedir?",
        options: [
          "Ay dolanırken aydınlık yarısını farklı açılardan görmemiz",
          "Dünya'nın gölgesinin her hafta Ay'ı örtmesi",
          "Ay'ın biçim değiştirmesi",
        ],
        answer: 0,
        explanation:
          "Güneş Ay'ın yarısını aydınlatır; Ay dolandıkça bu yarının bize görünen oranı değişir.",
      },
      {
        question: "Ay neden Dünya'nın çevresinde kalır?",
        options: ["Kütle çekimi", "Rüzgâr", "Mıknatıs"],
        answer: 0,
        explanation:
          "Dünya'nın kütle çekimi Ay'ın hareket yolunu sürekli bükerek onu yörüngede tutar.",
      },
    ],
    labMode: "space-light",
    labPrompt: "Ay'ı yörüngede sürükle; Dünya'dan görülen evre ile Güneş'in aydınlattığı yarıyı eşleştir.",
  },
  {
    slug: "kati-ve-sivi",
    title: "Katı ve sıvı",
    kicker: "Madde • Hâller ve tanecikler",
    icon: "🧊",
    accent: "#00b4d8",
    summary:
      "Katılar biçimlerini korur, sıvılar kabın şeklini alır; ikisi de taneciklerden oluşur ve yer kaplar.",
    bigQuestion:
      "Buz eriyince 'yok' mu olur, yoksa aynı madde farklı davranmaya mı başlar?",
    storySections: [
      {
        title: "Madde yer kaplar",
        body:
          "Etrafımızdaki nesnelerin çoğu maddedir. Katıların belirli bir şekli ve hacmi vardır. Sıvıların belirli hacmi vardır ama sabit şekli yoktur; içine konduğu kabın ulaşabildiği bölümünün şeklini alır.",
        wonder:
          "Kum taneleri birlikte dökülebilir ama her bir kum tanesi katıdır; kumun yığın hâlindeki davranışı onu sıvı yapmaz.",
      },
      {
        title: "Görünmeyen tanecik düzeni",
        body:
          "Basit tanecik modelinde katının tanecikleri birbirine yakın, düzenli konumlarda titreşir. Sıvıda tanecikler yine yakındır fakat birbirlerinin yanından kayabilir. Bu yüzden sıvı akar ve kabın şeklini alır.",
        wonder:
          "Tanecik çizimleri gerçek taneciklerin fotoğrafı değildir; davranışı anlamamıza yardım eden bilimsel modellerdir.",
      },
      {
        title: "Isı alınca, ısı verince",
        body:
          "Buz çevresinden yeterli ısı aldığında erir ve sıvı suya dönüşür. Su yeterince soğuyup ısı verdiğinde donar. Hâl değişiminde madde kaybolmaz; taneciklerin hareketi ve düzeni değişir.",
        wonder:
          "Saf su normal atmosfer basıncında yaklaşık 0 °C'de donar; tuz gibi çözünmüş maddeler donma sıcaklığını değiştirebilir.",
      },
    ],
    facts: [
      {
        icon: "💧",
        title: "Sıvının yüzeyi",
        body:
          "Durgun bir sıvının serbest yüzeyi, yer çekimi nedeniyle bulunduğu kaba göre yataya yakın olur.",
      },
      {
        icon: "❄️",
        title: "Su donunca genleşir",
        body:
          "Çoğu maddenin tersine su donarken hacmi artar; bu yüzden buz sıvı suyun üzerinde yüzer.",
      },
      {
        icon: "⚖️",
        title: "Erime kütleyi yok etmez",
        body:
          "Kapalı bir sistemde buz eridiğinde toplam madde miktarı aynı kalır.",
      },
    ],
    glossary: [
      { term: "Madde", definition: "Kütlesi olan ve uzayda yer kaplayan şey." },
      { term: "Katı", definition: "Belirli biçim ve hacme sahip madde hâli." },
      {
        term: "Sıvı",
        definition: "Belirli hacmi olup bulunduğu kabın şeklini alan madde hâli.",
      },
      { term: "Erime", definition: "Katının ısı alarak sıvıya dönüşmesi." },
    ],
    observation: {
      title: "Buzun kaybolmayan suyu",
      time: "20–40 dakika",
      materials: ["Şeffaf bardak", "Bir buz küpü", "Silinebilir kalem veya bant"],
      steps: [
        "Buz küpünü bardağa koy ve bardağın dışından üst seviyesini işaretle.",
        "Buzun biçimini çiz ve beş dakikada bir değişimi gözle.",
        "Tamamen eridiğinde suyun hâlini ve kabın şeklini nasıl aldığını anlat.",
        "Bardağın dışındaki damlaların nereden gelmiş olabileceğini düşün.",
      ],
      safety:
        "Cam yerine kırılmaz bardak kullan. Suyu içme; yere dökülürse kaymamak için hemen sil.",
      think:
        "Buz eridiğinde madde nereye gitti? Bardağın dışındaki damla buzun içinden mi geçti?",
    },
    parentNote:
      "Bardağın dışındaki suyun bardaktan sızmadığını; havadaki su buharının soğuk yüzeyde yoğunlaştığını tartışın. 'Tanecikler erir' demeyin: Buz erir, su molekülleri ise daha hareketli bir düzene geçer.",
    quiz: [
      {
        question: "Sıvıların biçimi için hangisi doğrudur?",
        options: [
          "Bulundukları kabın şeklini alırlar",
          "Her zaman küp şeklindedirler",
          "Hiç yer kaplamazlar",
        ],
        answer: 0,
        explanation:
          "Sıvı tanecikleri birbirinin yanından kayabildiği için sıvı akar ve kabın biçimine uyar.",
      },
      {
        question: "Buz erirken ne olur?",
        options: [
          "Katı su sıvı suya dönüşür",
          "Su tamamen yok olur",
          "Su başka bir element olur",
        ],
        answer: 0,
        explanation:
          "Erime fiziksel bir hâl değişimidir; madde yine sudur, tanecik düzeni değişir.",
      },
      {
        question: "Buz neden suyun üstünde yüzer?",
        options: [
          "Buzun yoğunluğu sıvı sudan daha düşüktür",
          "Buzun içinde ateş vardır",
          "Su mıknatıs gibi iter",
        ],
        answer: 0,
        explanation:
          "Su donarken daha açık bir yapı oluşturur; aynı miktar su daha çok yer kaplar ve yoğunluğu azalır.",
      },
    ],
    labMode: "matter-motion",
    labPrompt: "Isı kaydırıcısını değiştir; taneciklerin katı ve sıvı hâlde nasıl hareket ettiğini gör.",
  },
  {
    slug: "isik-ve-golge",
    title: "Işık ve gölge",
    kicker: "Fizik • Işığın davranışı",
    icon: "🔦",
    accent: "#ff9f1c",
    summary:
      "Işık doğrusal yollar boyunca yayılır; saydam olmayan bir cisim ışığın önüne geçtiğinde gölge oluşur.",
    bigQuestion:
      "Aynı oyuncağın gölgesi bazen neden kendisinden küçük, bazen dev gibi olabilir?",
    storySections: [
      {
        title: "Görmenin görünmez taşıyıcısı",
        body:
          "Güneş, lamba ve alev ışık kaynağıdır. Bir cismi görebilmek için kaynaktan çıkan ışığın cisme çarpıp gözümüze yansıması gerekir. Kendi ışığını üretmeyen Ay, kitap ve masa gibi nesneleri yansıttıkları ışık sayesinde görürüz.",
        wonder:
          "Karanlık bir odadaki kırmızı top, kırmızı olmayı bırakmaz; yalnızca gözümüze ondan yeterli ışık gelmez.",
      },
      {
        title: "Işık engelle karşılaşınca",
        body:
          "Saydam maddeler ışığın çoğunu geçirir, yarı saydam maddeler bir bölümünü geçirip saçar, opak maddeler ise büyük bölümünü geçirmez. Opak cismin arkasındaki ışık alamayan bölgede gölge oluşur.",
        wonder:
          "Gölge nesnenin rengi hakkında bilgi vermez; çoğunlukla yalnızca dış biçimini gösterir.",
      },
      {
        title: "Boyu uzaklıkla değişen karanlık şekil",
        body:
          "Cisim ışık kaynağına yaklaştığında daha geniş ışık demetini engeller ve perde üzerindeki gölgesi büyüyebilir. Perdeye yaklaştığında gölge küçülüp keskinleşebilir. Güneş gökyüzünde alçakken uzun, yüksekteyken daha kısa gölgeler görürüz.",
        wonder:
          "Birden fazla ışık kaynağı, aynı cismin birden fazla gölgesini oluşturabilir.",
      },
    ],
    facts: [
      {
        icon: "🌈",
        title: "Beyaz ışık bir karışım",
        body:
          "Prizma ya da su damlaları beyaz ışığı farklı renklere ayırabilir.",
      },
      {
        icon: "🪞",
        title: "Ayna düzenli yansıtır",
        body:
          "Düzgün yüzeyler ışığı daha düzenli yansıttığı için net görüntüler oluşabilir.",
      },
      {
        icon: "🌑",
        title: "Tutulma da gölge olayıdır",
        body:
          "Güneş tutulmasında Ay, Güneş ışığının Dünya'nın bir bölümüne ulaşmasını engeller; Ay tutulmasında Ay, Dünya'nın gölgesinden geçer.",
      },
    ],
    glossary: [
      { term: "Işık kaynağı", definition: "Kendi ışığını üreten cisim." },
      { term: "Yansıma", definition: "Işığın bir yüzeye çarpıp geri dönmesi." },
      {
        term: "Opak",
        definition: "Işığın büyük bölümünü geçirmeyen madde.",
      },
      { term: "Gölge", definition: "Işığın engellenmesiyle oluşan karanlık bölge." },
    ],
    observation: {
      title: "Gölge tiyatrosu laboratuvarı",
      time: "12 dakika",
      materials: ["El feneri", "Küçük oyuncak", "Beyaz duvar veya kâğıt"],
      steps: [
        "Feneri sabit tut ve oyuncağı fenerle duvar arasına koy.",
        "Oyuncağı fener yakınına getir; gölgenin boyunu gözle.",
        "Oyuncağı duvara yaklaştır; gölgeyi yeniden karşılaştır.",
        "Gölgenin en keskin olduğu konumu bulup nedenini düşün.",
      ],
      safety:
        "Feneri göze tutma. Sıcak ampul kullanma; LED el fenerini yetişkin gözetiminde kullan.",
      think:
        "Oyuncak büyümediği hâlde gölgesi neden büyüyüp küçüldü?",
    },
    parentNote:
      "Çocuğun konumları çizerek ışın yollarını tahmin etmesini sağlayın. Güneş'le gölge deneyi yapılabilir ama Güneş'e doğrudan bakılmamalıdır. Lazer kullanmayın.",
    quiz: [
      {
        question: "Bir cismi görebilmek için ne gerekir?",
        options: [
          "Cisimden yansıyan ışığın gözümüze gelmesi",
          "Cismin mutlaka ses çıkarması",
          "Cismin sıcak olması",
        ],
        answer: 0,
        explanation:
          "Göz ışığı algılar; ışık kaynağından gelip cisimden yansıyan ışık gözümüze ulaştığında cismi görürüz.",
      },
      {
        question: "Gölge nasıl oluşur?",
        options: [
          "Işık opak bir cisim tarafından engellenince",
          "Ses çok yükselince",
          "Sıvılar donunca",
        ],
        answer: 0,
        explanation:
          "Cismin arkasındaki bazı bölgelere ışık ulaşamaz ve karanlık bir alan oluşur.",
      },
      {
        question: "Oyuncak ışık kaynağına yaklaştırılırsa duvardaki gölgesi genellikle ne olur?",
        options: ["Büyür", "Tamamen renklenir", "Her zaman yok olur"],
        answer: 0,
        explanation:
          "Işığa yakın cisim daha geniş açılı bir ışık demetini engeller; perdedeki gölge büyüyebilir.",
      },
    ],
    labMode: "space-light",
    labPrompt: "Işık kaynağını ve cismi sürükle; gölgenin boyu ile keskinliğinin nasıl değiştiğini gör.",
  },
  {
    slug: "itme-cekme-ve-yuvarlanma",
    title: "İtme, çekme ve yuvarlanma",
    kicker: "Fizik • Kuvvet ve hareket",
    icon: "🛹",
    accent: "#fb5607",
    summary:
      "İtme ve çekme birer kuvvettir; cismin hızını, yönünü ya da biçimini değiştirebilir.",
    bigQuestion:
      "Aynı oyuncak araba halıda neden çabuk durur, düz zeminde neden daha uzağa gider?",
    storySections: [
      {
        title: "Hareketteki değişimin adı",
        body:
          "Kuvvet bir itme ya da çekmedir. Duran bir cismi harekete geçirebilir, hareketliyi hızlandırabilir, yavaşlatabilir veya yönünü değiştirebilir. Oyun hamurunu sıkarken olduğu gibi cismin biçimini de değiştirebilir.",
        wonder:
          "Bir cisim hareket ediyor diye mutlaka hareket yönünde sürekli kuvvet uygulanması gerekmez; kuvvetler hareketi değiştirir.",
      },
      {
        title: "Denge varsa değişim azdır",
        body:
          "İki kişi bir kutuyu zıt yönlerde eşit kuvvetle iterse kuvvetler dengelenebilir ve kutunun hareketi değişmeyebilir. Bir taraf daha güçlü iterse net kuvvet o yöne olur. Net kuvvet, bütün kuvvetlerin birlikte oluşturduğu etkidir.",
        wonder:
          "Masadaki kitabı yer çekimi aşağı çekerken masa da kitabı yukarı destekler; kitap bu yüzden düşmez.",
      },
      {
        title: "Sürtünme: hem yardımcı hem engel",
        body:
          "Sürtünme, temas eden yüzeylerin göreli kaymasına ya da kayma eğilimine karşı koyar. Pürüzlü halıda oyuncak araba daha çabuk yavaşlar. Yürürken ayağının kaymaması ve frenlerin bisikleti durdurması içinse sürtünme gereklidir.",
        wonder:
          "Tekerlekler kayma yerine yuvarlanmayı sağladığından ağır yükleri taşımayı kolaylaştırabilir.",
      },
    ],
    facts: [
      {
        icon: "🏀",
        title: "Top yön değiştirir",
        body:
          "Top yere çarptığında zemin topa kuvvet uygular; top sıkışıp yeniden açılırken yukarı seker.",
      },
      {
        icon: "🧦",
        title: "Kaygan zemin",
        body:
          "Çorapla düzgün zeminde sürtünme azalabilir; bu yüzden koşmak düşme riskini artırır.",
      },
      {
        icon: "🛞",
        title: "Mil ve tekerlek",
        body:
          "Tekerleğin bir mil çevresinde dönmesi, cisimleri yüzey boyunca daha kolay taşımamıza yardım eder.",
      },
    ],
    glossary: [
      { term: "Kuvvet", definition: "Bir cisme uygulanan itme veya çekme." },
      { term: "Hareket", definition: "Bir cismin konumunun zamanla değişmesi." },
      {
        term: "Sürtünme",
        definition: "Temas eden yüzeyler arasındaki harekete karşı koyan kuvvet.",
      },
      {
        term: "Net kuvvet",
        definition: "Bir cisme etki eden tüm kuvvetlerin birleşik etkisi.",
      },
    ],
    observation: {
      title: "Hangi zeminde daha uzağa?",
      time: "15 dakika",
      materials: ["Oyuncak araba", "Karton rampa", "Kitap", "Halı ve düz zemin", "Mezura"],
      steps: [
        "Kitaba dayadığın kartonla alçak bir rampa yap.",
        "Arabayı rampanın aynı başlangıç çizgisinden, itmeden bırak.",
        "Düz zeminde ve halıda durduğu yere kadar olan uzaklığı ölç.",
        "Her zeminde üç deneme yapıp sonuçları karşılaştır.",
      ],
      safety:
        "Rampayı merdivende kurma. Aracı insanların yürüdüğü yere veya evcil hayvanlara doğru gönderme.",
      think:
        "Aynı başlangıcı kullanmak karşılaştırmayı neden daha güvenilir yaptı?",
    },
    parentNote:
      "Deneyde tek değişken olarak yüzeyi değiştirmeye çalışın; rampa yüksekliği ve araç aynı kalsın. 'Sürtünme kötüdür' genellemesinden kaçının: hareketi yavaşlatır ama tutunmayı da mümkün kılar.",
    quiz: [
      {
        question: "Kuvvet nedir?",
        options: ["İtme veya çekme", "Yalnızca hızlı hareket", "Bir madde hâli"],
        answer: 0,
        explanation:
          "Kuvvet, cisimlerin hareketini veya biçimini değiştirebilen itme ya da çekmedir.",
      },
      {
        question: "Oyuncak araba halıda neden daha çabuk durabilir?",
        options: [
          "Sürtünme daha büyük olabilir",
          "Yer çekimi halıda kaybolur",
          "Araba aniden ağırlaşır",
        ],
        answer: 0,
        explanation:
          "Pürüzlü yüzeyle tekerlekler arasındaki daha büyük hareket direnci aracı daha hızlı yavaşlatır.",
      },
      {
        question: "Bir cisme zıt yönlerde eşit kuvvet uygulanırsa net kuvvet ne olabilir?",
        options: ["Sıfır", "Her zaman çok büyük", "Yalnızca yukarı"],
        answer: 0,
        explanation:
          "Eşit ve zıt kuvvetler birbirinin etkisini dengeler; cismin hareketinde bu nedenle değişim olmayabilir.",
      },
    ],
    labMode: "matter-motion",
    labPrompt: "İtme gücünü ve yüzeyi seç; arabanın hızını ve durma mesafesini karşılaştır.",
  },
  {
    slug: "miknatislar",
    title: "Mıknatıslar",
    kicker: "Fizik • Görünmez kuvvet",
    icon: "🧲",
    accent: "#8338ec",
    summary:
      "Mıknatıslar bazı metalleri temas etmeden çekebilir; kutupları birbirini çekebilir ya da itebilir.",
    bigQuestion:
      "Mıknatıs kâğıdın arkasındaki ataşı nasıl dokunmadan hareket ettirebilir?",
    storySections: [
      {
        title: "Görünmeyen etki alanı",
        body:
          "Mıknatısın çevresinde manyetik alan bulunur. Bu alan bazı maddelere ve başka mıknatıslara kuvvet uygular. Demir ve çelikten yapılmış pek çok nesne çekilir; ancak her metal manyetik değildir. Örneğin alüminyum folyo sıradan mıknatısa belirgin biçimde çekilmez.",
        wonder:
          "Mıknatısın kuvvetini hissedebilirsin ama manyetik alanı doğrudan gözünle göremezsin.",
      },
      {
        title: "Kuzey ve güney kutupları",
        body:
          "Her mıknatısın kuzey ve güney denen iki kutbu vardır. Farklı kutuplar birbirini çeker, aynı kutuplar iter. Çubuk mıknatısı ikiye bölsen tek kutup elde etmezsin; daha küçük, iki kutuplu mıknatıslar oluşur.",
        wonder:
          "Kuvvet genellikle mıknatısın kutup bölgelerinde daha güçlü hissedilir.",
      },
      {
        title: "Dünya da dev bir mıknatıs gibi",
        body:
          "Dünya'nın çevresinde bir manyetik alan vardır. Serbestçe dönebilen pusula iğnesi bu alana göre yönelir ve kuzey-güney doğrultusunu bulmaya yardım eder. Kuşlar ve deniz kaplumbağaları gibi bazı canlılar da Dünya'nın manyetik alanından yön bulmada yararlanabilir.",
        wonder:
          "Pusulanın gösterdiği manyetik kuzey ile coğrafi Kuzey Kutbu tam olarak aynı nokta değildir.",
      },
    ],
    facts: [
      {
        icon: "🥫",
        title: "Her parlak metal çekilmez",
        body:
          "Bakır, altın ve alüminyum sıradan mıknatıslar tarafından güçlü biçimde çekilmez.",
      },
      {
        icon: "🧭",
        title: "Pusula küçük mıknatıs",
        body:
          "Pusula iğnesi serbest dönebilen mıknatıslanmış bir parçadır.",
      },
      {
        icon: "🌍",
        title: "Alan bizi de korur",
        body:
          "Dünya'nın manyetik alanı Güneş'ten gelen yüklü parçacıkların büyük bölümünü yönlendirir.",
      },
    ],
    glossary: [
      {
        term: "Manyetik alan",
        definition: "Mıknatısın manyetik kuvvet uygulayabildiği çevre bölgesi.",
      },
      { term: "Kutup", definition: "Mıknatısın kuzey veya güney olarak adlandırılan ucu." },
      {
        term: "Çekme",
        definition: "Cisimleri birbirine yaklaştıran kuvvet etkisi.",
      },
      { term: "İtme", definition: "Cisimleri birbirinden uzaklaştıran kuvvet etkisi." },
    ],
    observation: {
      title: "Manyetik mi, değil mi?",
      time: "12 dakika",
      materials: [
        "Büyük, sağlam bir buzdolabı mıknatısı",
        "Ataş",
        "Tahta kalem",
        "Plastik kapak",
        "Alüminyum folyo",
        "Çelik kaşık",
      ],
      steps: [
        "Nesnelere dokunmadan önce hangilerinin çekileceğini tahmin et.",
        "Mıknatısı her nesneye yavaşça yaklaştır ve sonucu kaydet.",
        "Çekilen nesnelerin ortak maddesini araştır.",
        "Bir kâğıdın arkasındaki ataşı mıknatısla hareket ettirmeyi dene.",
      ],
      safety:
        "Küçük ve güçlü mıknatıs kullanma; mıknatısları ağza sokma. Telefon, kart, saat, tıbbi cihaz ve elektroniklerden uzak tut. Yetişkin gözetimi şarttır.",
      think:
        "Deneyin 'bütün metaller mıknatısa çekilir' fikrini destekledi mi?",
    },
    parentNote:
      "Yutulan mıknatıslar çok ciddi yaralanmaya yol açabilir; küçük neodimyum mıknatıslar bu etkinlik için uygun değildir. Kalp pili veya başka tıbbi cihaz varsa üretici güvenlik yönergelerine uyun. Nesneyi malzemesiyle ilişkilendirin: parlak görünmek manyetik olmak demek değildir.",
    quiz: [
      {
        question: "Mıknatıs hangi nesneyi büyük olasılıkla çeker?",
        options: ["Çelik ataş", "Plastik kapak", "Tahta çubuk"],
        answer: 0,
        explanation:
          "Çelik çoğunlukla demir içerir ve sıradan mıknatıslardan güçlü biçimde etkilenebilir.",
      },
      {
        question: "İki mıknatısın aynı kutupları yaklaştırılırsa ne olur?",
        options: ["Birbirini iter", "Birbirini çeker", "İkisi de erir"],
        answer: 0,
        explanation:
          "Aynı manyetik kutuplar iter; farklı kutuplar birbirini çeker.",
      },
      {
        question: "Pusula neden yön gösterebilir?",
        options: [
          "İğnesi Dünya'nın manyetik alanına göre yönelir",
          "İçinde küçük bir rüzgâr vardır",
          "Güneş ışığını depolar",
        ],
        answer: 0,
        explanation:
          "Mıknatıslanmış pusula iğnesi serbestçe döner ve Dünya'nın manyetik alanıyla hizalanır.",
      },
    ],
    labMode: "magnet",
    labPrompt: "Kutupları çevir ve uzaklığı değiştir; çekme-itme kuvvetinin nasıl değiştiğini hisset.",
  },
  {
    slug: "sayilar-sifir-ve-sayi-dogrusu",
    title: "Sayılar, sıfır ve sayı doğrusu",
    kicker: "Matematik • Sayıların dili",
    icon: "🔢",
    accent: "#9c36b5",
    summary:
      "Sayılar miktarı, sırayı ve ölçüyü anlatır; sıfır hem “hiç yok” demenin hem de basamaklı sayı yazmanın güçlü bir yoludur.",
    bigQuestion:
      "Hiç elma yoksa bunu bir sayıyla nasıl anlatırız; sıfır neden “hiç” olmasına rağmen çok önemlidir?",
    storySections: [
      {
        title: "Sayı neyi anlatır?",
        body:
          "Bir sepetteki elmaları sayarken her elmaya bir sayı sözcüğü söylersin: bir, iki, üç… Son söylediğin sayı, sepette kaç elma olduğunu anlatır. Sayılar yalnızca miktar için kullanılmaz; yarıştaki sırayı, bir nesnenin uzunluğunu, saati ya da bir evin adresini de gösterebilir. “Beş” sayı fikridir; 5 ise bu fikri yazmak için kullandığımız rakamdır.",
        wonder:
          "Aynı 5 sayısı beş alkışla, beş noktayla, beş parmakla ya da 5 rakamıyla gösterilebilir.",
      },
      {
        title: "Sıfırın iki önemli görevi",
        body:
          "Kutuda hiç kalem kalmadığında kalem sayısı sıfırdır. Sıfır ayrıca basamaklı sayı yazımında yer tutar: 205 sayısındaki 0, hiç onluk olmadığını gösterir. Onu çıkarırsan 25 elde edersin ve sayının değeri bütünüyle değişir. Bu yüzden sıfır “önemsiz bir boşluk” değil, anlam taşıyan bir sayıdır.",
        wonder:
          "10 sayısındaki 0, bir tane onluk ve hiç birlik olduğunu anlatır.",
      },
      {
        title: "Sayı doğrusu: sayıların yolu",
        body:
          "Sayı doğrusu, sayıların eşit aralıklarla yerleştirildiği bir yoldur. Sağa gittikçe sayılar büyür, sola gittikçe küçülür. Sıfırdan başlayıp üç eşit adım sağa gidersen 3'e ulaşırsın. Toplama ileriye, çıkarma geriye doğru adım atmak gibi modellenebilir. İki sayı arasındaki adım sayısı, aralarındaki uzaklığı gösterir.",
        wonder:
          "Sayı doğrusu sıfırda bitmez; sıfırın solunda daha sonra öğreneceğin eksi sayılar da bulunur.",
      },
    ],
    facts: [
      {
        icon: "✋",
        title: "Son sözcük toplamı söyler",
        body:
          "Nesneleri birer kez saydığında söylediğin son sayı sözcüğü, nesnelerin toplam miktarını gösterir.",
      },
      {
        icon: "0️⃣",
        title: "Sıfır büyük bir buluş",
        body:
          "Sıfır düşüncesi farklı kültürlerde görülse de bugünkü basamaklı sayı sistemindeki sıfır işareti ve hesap kuralları Hindistan'da gelişti, sonra geniş bir coğrafyaya yayıldı.",
      },
      {
        icon: "🔟",
        title: "Yalnızca on rakam var",
        body:
          "Onluk sayı sisteminde 0'dan 9'a kadar on rakam kullanır, bu rakamları farklı basamaklara yerleştirerek sayısız sayı yazarız.",
      },
    ],
    glossary: [
      {
        term: "Sayı",
        definition: "Miktar, sıra ya da ölçü gibi matematiksel bir düşünceyi anlatan kavram.",
      },
      {
        term: "Rakam",
        definition: "Sayıları yazmak için kullandığımız 0, 1, 2, 3, 4, 5, 6, 7, 8 ve 9 işaretlerinden her biri.",
      },
      {
        term: "Sıfır",
        definition: "Bir miktarın hiç olmadığını gösteren ve basamaklı yazımda yer tutabilen sayı.",
      },
      {
        term: "Sayı doğrusu",
        definition: "Sayıların büyüklük sırasına göre eşit aralıklarla gösterildiği çizgi.",
      },
    ],
    observation: {
      title: "Masa üstünde sayı doğrusu",
      time: "12 dakika",
      materials: [
        "11 küçük kâğıt",
        "Kalem",
        "Bir oyuncak figür",
        "Düz bir masa",
      ],
      steps: [
        "Kâğıtlara 0'dan 10'a kadar sayıları yaz ve masada soldan sağa sırala.",
        "Oyuncak figürü 0'a koy; önce hangi sayıya gideceğini tahmin et, sonra üç adım sağa ilerlet.",
        "Figürü 7'ye koy ve iki adım sola ilerlet. Başlangıç ile bitiş sayılarını sesli söyle.",
        "İki farklı sayı seç; aralarında kaç eşit adım olduğunu say ve hangisinin daha büyük olduğunu anlat.",
      ],
      safety:
        "Etkinliği düz ve sağlam bir masa üzerinde yap. Kâğıtları yere dizip koşma ya da zıplama; küçük parçaları ağzından uzak tut.",
      think:
        "Oyuncak 0'dayken hiç ilerlemezse hangi sayıda kalır? Sıfır adım da bir sonuç anlatır mı?",
    },
    parentNote:
      "Çocuğun miktarı nesneyle, sayı sözcüğünü kavramla ve rakamı yazı işaretiyle ilişkilendirmesine yardım edin. “Beş sayı, 5 onu yazan rakamdır” ayrımını günlük dilde nazikçe modelleyin. Sıfırı yalnızca 'hiçlik' olarak değil, 10 ve 205 gibi sayılarda basamak değerini koruyan bir sayı olarak da gösterin.",
    quiz: [
      {
        question: "Bir tabakta hiç kurabiye kalmadıysa kurabiye sayısı kaçtır?",
        options: ["0", "1", "10"],
        answer: 0,
        explanation:
          "Sıfır, saydığımız türden hiçbir nesne kalmadığını anlatır.",
      },
      {
        question: "Sayı doğrusunda 4'ün sağında hangi sayı bulunabilir?",
        options: ["7", "2", "0"],
        answer: 0,
        explanation:
          "Sayı doğrusunda sağa doğru gidildikçe sayılar büyür; 7, 4'ten büyüktür.",
      },
      {
        question: "205 sayısındaki 0 neyi gösterir?",
        options: ["Hiç onluk olmadığını", "Hiç yüzlük olmadığını", "Hiç birlik olmadığını"],
        answer: 0,
        explanation:
          "205; iki yüzlük, sıfır onluk ve beş birlikten oluşur. Sıfır, onlar basamağındaki yeri korur.",
      },
    ],
    labMode: "mathematics",
    labPrompt: "Başlangıç sayısını ve adım sayısını değiştir; sayı doğrusunda toplamanın nasıl ilerlediğini izle.",
  },
  {
    slug: "sekiller-oruntuler-ve-simetri",
    title: "Şekiller, örüntüler ve simetri",
    kicker: "Matematik • Geometri ve düzen",
    icon: "🔷",
    accent: "#9c36b5",
    summary:
      "Şekilleri renklerine değil özelliklerine bakarak tanır, örüntünün kuralını bulur ve iki yarının bir simetri doğrusu boyunca nasıl eşleştiğini araştırırız.",
    bigQuestion:
      "Bir şekli döndürünce adı neden değişmez; bir örüntüde sırada ne olacağını nasıl bilebiliriz?",
    storySections: [
      {
        title: "Şeklin kimliği renginden gelmez",
        body:
          "Düzlemsel şekilleri kenar ve köşe gibi özellikleriyle tanırız. Üçgenin üç düz kenarı ve üç köşesi vardır. Karenin dört eşit kenarı ve dört dik köşesi bulunur. Çemberin ise düz kenarı ve köşesi yoktur. Bir şekli büyütmek, boyamak ya da döndürmek bu özellikleri değiştirmez; yana yatmış bir kare hâlâ karedir.",
        wonder:
          "Bir şekli tanımak için “Neye benziyor?” yerine “Kaç kenarı ve köşesi var?” diye sorabilirsin.",
      },
      {
        title: "Örüntünün gizli kuralı",
        body:
          "Örüntü, belirli bir kurala göre devam eden düzendir. Kırmızı–mavi–kırmızı–mavi dizisinde tekrar eden birim “kırmızı–mavi”dir; sıradaki rengin kırmızı olacağını bu kurala bakarak tahmin ederiz. Örüntüler yalnız şekil ve renkle kurulmaz; alkış–diz vurma gibi ses ve hareketlerle, hatta sayılarla da kurulabilir.",
        wonder:
          "Yalnızca birkaç parçaya bakınca birden fazla kural mümkün olabilir; iyi bir kural gördüğümüz bütün parçaları açıklamalıdır.",
      },
      {
        title: "Katlayınca buluşan yarılar",
        body:
          "Bir şekli belirli bir çizgi boyunca katladığında iki yarısı tam üst üste geliyorsa o çizgi bir simetri doğrusudur. Bazı şekillerin birden fazla simetri doğrusu vardır, bazılarının hiç yoktur. Simetri yalnız iki benzer resmin yan yana durması değildir; karşılıklı noktalar simetri doğrusuna eşit uzaklıkta olmalıdır.",
        wonder:
          "Bir karenin ortasından geçen dört simetri doğrusu vardır: ikisi karşılıklı kenarları, ikisi karşılıklı köşeleri birleştirir.",
      },
    ],
    facts: [
      {
        icon: "◻️",
        title: "Kare aynı zamanda dikdörtgendir",
        body:
          "Matematikte dört açısı da dik olan her dörtgen dikdörtgendir. Karenin de dört dik açısı vardır; eşit kenarları onu özel bir dikdörtgen yapar.",
      },
      {
        icon: "⭕",
        title: "Çemberin çok sayıda aynası var",
        body:
          "Merkezden geçen her doğru çemberi eşleşen iki yarıya böler; bu nedenle bir çemberin sonsuz sayıda simetri doğrusu vardır.",
      },
      {
        icon: "👏",
        title: "Örüntüyü kulağın da bulabilir",
        body:
          "Alkış–alkış–dur biçimindeki tekrar, gözle görülmese bile kurallı bir ses örüntüsüdür.",
      },
    ],
    glossary: [
      {
        term: "Kenar",
        definition: "Bir düzlemsel şeklin sınırını oluşturan doğru parçası.",
      },
      {
        term: "Köşe",
        definition: "İki kenarın birleştiği nokta.",
      },
      {
        term: "Örüntü",
        definition: "Bir kurala göre sıralanan ve devam ettirilebilen şekil, sayı, ses ya da hareket düzeni.",
      },
      {
        term: "Simetri doğrusu",
        definition: "Bir şekli katlandığında üst üste gelen iki ayna yarısına ayıran doğru.",
      },
    ],
    observation: {
      title: "Katla, eşleştir, kuralı bul",
      time: "15 dakika",
      materials: [
        "Birkaç beyaz kâğıt",
        "Kalem veya pastel boya",
        "Yuvarlak bir bardak altlığı",
        "Cetvel",
      ],
      steps: [
        "Bir kâğıda üçgen, kare, dikdörtgen ve bardak altlığını kullanarak bir çember çiz.",
        "Her şeklin kenar ve köşe sayılarını söyle; kâğıdı çevirince bu sayıların değişip değişmediğini kontrol et.",
        "Her şeklin ortasından geçtiğini düşündüğün bir çizgi çiz, kâğıdı bu çizgiden katla ve iki yarının üst üste gelip gelmediğine bak.",
        "Başka bir kâğıda üçgen–çember–üçgen–çember örüntüsü çiz. Tekrar eden birimi çerçevele ve sıradaki iki şekli ekle.",
      ],
      safety:
        "Kırılabilir cam eşya yerine sağlam bir bardak altlığı kullan. Kâğıt katlarken ve cetvelle çalışırken etkinliği masa üzerinde, yetişkin yanında yap.",
      think:
        "Bir şekli farklı renge boyamak ya da döndürmek kenarlarını, köşelerini veya simetri doğrularını değiştirir mi?",
    },
    parentNote:
      "Şekilleri yalnızca alışılmış duruşlarında göstermeyin; döndürülmüş ve farklı boyutlardaki örnekleri de özellikleriyle adlandırın. Çocuğa cevabı söylemeden önce örüntünün tekrar eden en küçük birimini buldurun. Simetriyi “iki aynı şey” diye değil, bir çizgi boyunca katlandığında karşılıklı parçaların çakışması olarak modelleyin.",
    quiz: [
      {
        question: "Bir kareyi döndürüp köşesi üzerine getirirsek hangi şekil olur?",
        options: ["Yine kare", "Üçgen", "Çember"],
        answer: 0,
        explanation:
          "Döndürmek karenin dört eşit kenarını ve dört dik köşesini değiştirmez; şekil yine karedir.",
      },
      {
        question: "Kırmızı–mavi–kırmızı–mavi örüntüsünde sıradaki renk hangisidir?",
        options: ["Kırmızı", "Yeşil", "Mor"],
        answer: 0,
        explanation:
          "Tekrar eden birim kırmızı–mavidir. Maviden sonra yeni birim kırmızıyla başlar.",
      },
      {
        question: "Çizdiğimiz bir doğrunun simetri doğrusu olduğunu nasıl sınarız?",
        options: [
          "Katlayınca iki yarının üst üste gelmesine bakarız",
          "Şeklin yalnız rengine bakarız",
          "Şekli daha büyük çizeriz",
        ],
        answer: 0,
        explanation:
          "Simetri doğrusu boyunca katlandığında karşılıklı noktalar ve şeklin iki yarısı birbiriyle çakışır.",
      },
    ],
    labMode: "mathematics",
    labPrompt: "Şekilleri karşılaştır, simetri doğrusunu aç ve tekrar eden örüntüde sıradaki parçayı tahmin et.",
  },
];

const topicClassification: Record<
  string,
  {
    category: CategoryId;
    lab: EncyclopediaTopic["lab"];
    readingTime: string;
  }
> = {
  "bes-duyum": { category: "ben", lab: "senses", readingTime: "6 dk" },
  "kalbim-ve-nefesim": { category: "ben", lab: "body", readingTime: "7 dk" },
  "tohumdan-bitkiye": { category: "canlilar", lab: "plant", readingTime: "7 dk" },
  "hayvanlar-ve-yasam-alanlari": {
    category: "canlilar",
    lab: "habitat",
    readingTime: "8 dk",
  },
  "hava-bugun-nasil": { category: "dunya", lab: "weather", readingTime: "7 dk" },
  "bir-su-damlasinin-yolculugu": {
    category: "dunya",
    lab: "water",
    readingTime: "7 dk",
  },
  "gece-ve-gunduz": { category: "uzay", lab: "orbit", readingTime: "7 dk" },
  "gunes-dunya-ve-ay": { category: "uzay", lab: "moon", readingTime: "8 dk" },
  "kati-ve-sivi": { category: "madde", lab: "matter", readingTime: "7 dk" },
  "isik-ve-golge": { category: "madde", lab: "light", readingTime: "7 dk" },
  "itme-cekme-ve-yuvarlanma": {
    category: "hareket",
    lab: "motion",
    readingTime: "8 dk",
  },
  miknatislar: { category: "hareket", lab: "magnet", readingTime: "7 dk" },
  "sayilar-sifir-ve-sayi-dogrusu": {
    category: "matematik",
    lab: "number",
    readingTime: "8 dk",
  },
  "sekiller-oruntuler-ve-simetri": {
    category: "matematik",
    lab: "shape",
    readingTime: "8 dk",
  },
};

const ENCYCLOPEDIA_REVIEWED_AT = "2026-08-01";

const topicSourcesBySlug: Record<string, EncyclopediaSource[]> = {
  "bes-duyum": [
    {
      title: "Gözler nasıl çalışır?",
      organization: "ABD Ulusal Göz Enstitüsü (NEI)",
      url: "https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work",
    },
    {
      title: "Nasıl işitiriz?",
      organization: "ABD Ulusal Sağırlık ve Diğer İletişim Bozuklukları Enstitüsü (NIDCD)",
      url: "https://www.nidcd.nih.gov/health/how-do-we-hear",
    },
    {
      title: "Tat ve koku",
      organization: "ABD Ulusal Sağırlık ve Diğer İletişim Bozuklukları Enstitüsü (NIDCD)",
      url: "https://www.nidcd.nih.gov/health/taste-smell",
    },
  ],
  "kalbim-ve-nefesim": [
    {
      title: "Kalp nasıl çalışır?",
      organization: "ABD Ulusal Kalp, Akciğer ve Kan Enstitüsü (NHLBI)",
      url: "https://www.nhlbi.nih.gov/health/heart",
    },
    {
      title: "Akciğerler nasıl çalışır?",
      organization: "ABD Ulusal Kalp, Akciğer ve Kan Enstitüsü (NHLBI)",
      url: "https://www.nhlbi.nih.gov/health/lungs",
    },
  ],
  "tohumdan-bitkiye": [
    {
      title: "Tozlaşma, döllenme ve tohumun çimlenmesi",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/biology-2e/pages/32-2-pollination-and-fertilization",
    },
    {
      title: "Fotosenteze genel bakış",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis",
    },
  ],
  "hayvanlar-ve-yasam-alanlari": [
    {
      title: "Ekolojinin kapsamı",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/biology-2e/pages/44-1-the-scope-of-ecology",
    },
    {
      title: "Karasal biyomlar",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/biology-2e/pages/44-3-terrestrial-biomes",
    },
  ],
  "hava-bugun-nasil": [
    {
      title: "Hava durumu ile iklim arasındaki fark nedir?",
      organization: "ABD Ulusal Okyanus ve Atmosfer Dairesi (NOAA NESDIS)",
      url: "https://www.nesdis.noaa.gov/about/k-12-education/understanding-our-planet/whats-the-difference-between-weather-and-climate",
    },
    {
      title: "İklim gözlem ağı ve ölçümler",
      organization: "ABD Ulusal Çevresel Bilgi Merkezleri (NOAA NCEI)",
      url: "https://www.ncei.noaa.gov/access/crn/",
    },
  ],
  "bir-su-damlasinin-yolculugu": [
    {
      title: "Su hakkında bilgi edin",
      organization: "ABD Jeoloji Araştırmaları Kurumu (USGS)",
      url: "https://www.usgs.gov/water-science-school/learn-about-water",
    },
    {
      title: "Su döngüsü",
      organization: "ABD Jeoloji Araştırmaları Kurumu (USGS)",
      url: "https://water.usgs.gov/vizlab/water-cycle/",
    },
  ],
  "gece-ve-gunduz": [
    {
      title: "Dünya nedir?",
      organization: "NASA",
      url: "https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-earth-grades-k-4/",
    },
    {
      title: "Dünya hakkında her şey",
      organization: "NASA Space Place",
      url: "https://spaceplace.nasa.gov/all-about-earth/en/",
    },
  ],
  "gunes-dunya-ve-ay": [
    {
      title: "Ay'ın evreleri",
      organization: "NASA Science",
      url: "https://science.nasa.gov/moon/moon-phases/",
    },
    {
      title: "Ay hakkında temel bilgiler",
      organization: "NASA Science",
      url: "https://science.nasa.gov/moon/facts/",
    },
  ],
  "kati-ve-sivi": [
    {
      title: "Moleküller önemlidir",
      organization: "Amerikan Kimya Derneği (ACS)",
      url: "https://www.acs.org/middleschoolchemistry/lessonplans/chapter1/lesson1.html",
    },
    {
      title: "Madde küçük parçacıklardan oluşur",
      organization: "Amerikan Kimya Derneği (ACS)",
      url: "https://www.acs.org/education/resources/k-8/inquiryinaction/fifth-grade.html",
    },
  ],
  "isik-ve-golge": [
    {
      title: "Işığın ışın modeli",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/college-physics-2e/pages/25-1-the-ray-aspect-of-light",
    },
    {
      title: "Yansıma yasası",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/college-physics-2e/pages/25-2-the-law-of-reflection",
    },
  ],
  "itme-cekme-ve-yuvarlanma": [
    {
      title: "Newton'ın birinci hareket yasası: Eylemsizlik",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/physics/pages/4-2-newtons-first-law-of-motion-inertia",
    },
    {
      title: "Newton'ın ikinci hareket yasası",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/physics/pages/4-3-newtons-second-law-of-motion",
    },
  ],
  miknatislar: [
    {
      title: "Yer manyetizması hakkında sık sorulan sorular",
      organization: "ABD Ulusal Çevresel Bilgi Merkezleri (NOAA NCEI)",
      url: "https://www.ncei.noaa.gov/products/geomagnetism-frequently-asked-questions",
    },
    {
      title: "Manyetik alanlar, alan çizgileri ve kuvvet",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/physics/pages/20-1-magnetic-fields-field-lines-and-force",
    },
  ],
  "sayilar-sifir-ve-sayi-dogrusu": [
    {
      title: "Doğal sayılara giriş",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/prealgebra-2e/pages/1-1-introduction-to-whole-numbers",
    },
    {
      title: "Doğal sayılarla toplama",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/prealgebra-2e/pages/1-2-add-whole-numbers",
    },
  ],
  "sekiller-oruntuler-ve-simetri": [
    {
      title: "Dikdörtgen, üçgen ve yamukların özellikleri",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/prealgebra-2e/pages/9-4-use-properties-of-rectangles-triangles-and-trapezoids",
    },
    {
      title: "Düzlemi kaplayan örüntüler",
      organization: "OpenStax · Rice Üniversitesi",
      url: "https://openstax.org/books/contemporary-mathematics/pages/10-5-tessellations",
    },
  ],
};

const relatedActivitiesByTopic: Partial<
  Record<string, EncyclopediaTopic["relatedActivities"]>
> = {
  "bes-duyum": [
    {
      slug: "vucudumuz",
      title: "Vücudumuz",
      emoji: "🫀",
      reason: "Duyu organlarını diğer organlarla aynı beden haritasında düşün.",
    },
  ],
  "kalbim-ve-nefesim": [
    {
      slug: "vucudumuz",
      title: "Vücudumuz",
      emoji: "🫀",
      reason: "Kalp, akciğer ve beynin görevlerini yeniden eşleştir.",
    },
  ],
  "tohumdan-bitkiye": [
    {
      slug: "bitki-buyume",
      title: "Bitki Büyümesi",
      emoji: "🌱",
      reason: "Çimlenme ve büyüme aşamalarını doğru sıraya yerleştir.",
    },
    {
      slug: "su-dongu",
      title: "Su Döngüsü",
      emoji: "💧",
      reason: "Bitkinin kullandığı suyun Dünya'daki büyük yolculuğunu izle.",
    },
  ],
  "hayvanlar-ve-yasam-alanlari": [
    {
      slug: "hayvanlar",
      title: "Hayvanlar",
      emoji: "🦁",
      reason: "Farklı hayvanların yaşam biçimlerini bilgi kartlarıyla karşılaştır.",
    },
    {
      slug: "grupla",
      title: "Grupla",
      emoji: "📦",
      reason: "Canlıları ortak özelliklerine göre sınıflandırma becerini kullan.",
    },
  ],
  "hava-bugun-nasil": [
    {
      slug: "hava-durumu",
      title: "Hava Durumu",
      emoji: "☀️",
      reason: "Farklı hava koşullarında hangi hazırlığın uygun olduğunu seç.",
    },
    {
      slug: "mevsimler",
      title: "Mevsimler",
      emoji: "🍂",
      reason: "Kısa süreli hava durumunu mevsim örüntülerinden ayır.",
    },
  ],
  "bir-su-damlasinin-yolculugu": [
    {
      slug: "su-dongu",
      title: "Su Döngüsü",
      emoji: "💧",
      reason: "Buharlaşma, yoğunlaşma ve yağış adımlarını sırala.",
    },
    {
      slug: "yagmur-damlasi",
      title: "Yağmur Damlası",
      emoji: "☂️",
      reason: "Yağmur temalı oyunda dikkat ve zamanlama becerini dene.",
    },
  ],
  "gece-ve-gunduz": [
    {
      slug: "gezegenler",
      title: "Gezegenler",
      emoji: "🪐",
      reason: "Dünya'yı Güneş Sistemi içindeki yerine yerleştir.",
    },
    {
      slug: "saat-ogren",
      title: "Saat Öğren",
      emoji: "🕐",
      reason: "Dünya'nın bir günlük dönüşünü saatlerle ilişkilendir.",
    },
  ],
  "gunes-dunya-ve-ay": [
    {
      slug: "gezegenler",
      title: "Gezegenler",
      emoji: "🪐",
      reason: "Güneş, gezegen ve doğal uydu kavramlarını yeniden kullan.",
    },
  ],
  "isik-ve-golge": [
    {
      slug: "renk-atolyesi",
      title: "Renk Atölyesi",
      emoji: "🎨",
      reason: "Işıkla gördüğümüz renkleri eğlenceli eşleştirmelerle pekiştir.",
    },
  ],
  "itme-cekme-ve-yuvarlanma": [
    {
      slug: "pong",
      title: "Masa Tenisi",
      emoji: "🏓",
      reason: "Çarpışma, yön değişimi ve zamanlamayı hareketli bir oyunda gözle.",
    },
    {
      slug: "asteroids",
      title: "Asteroids",
      emoji: "☄️",
      reason: "İtiş bittiğinde hareketin nasıl sürdüğüne dikkat et.",
    },
    {
      slug: "tugla-kir",
      title: "Tuğla Kırmaca",
      emoji: "🧱",
      reason: "Topun çarpışınca yön değiştirmesini farklı açılarda dene.",
    },
  ],
  "sayilar-sifir-ve-sayi-dogrusu": [
    {
      slug: "sayma-oyunu",
      title: "Sayma Oyunu",
      emoji: "🍎",
      reason: "Her nesneyi bir kez say ve son sayı sözcüğünün miktarı nasıl anlattığını gör.",
    },
    {
      slug: "sayi-sirasi",
      title: "Sayı Sırası",
      emoji: "📊",
      reason: "Sayıların soldan sağa büyüyen sırasını yeniden kur.",
    },
    {
      slug: "onluk-birlik",
      title: "Onluk & Birlik",
      emoji: "🧮",
      reason: "Rakamın bulunduğu basamağın sayının değerini nasıl değiştirdiğini dene.",
    },
  ],
  "sekiller-oruntuler-ve-simetri": [
    {
      slug: "sekil-tani",
      title: "Şekil Tanı",
      emoji: "⬛",
      reason: "Şekilleri kenar ve köşe özellikleriyle ayırt et.",
    },
    {
      slug: "desen-tamamla",
      title: "Desen Tamamla",
      emoji: "🎨",
      reason: "Tekrar eden birimi bul ve örüntünün sıradaki parçasını seç.",
    },
    {
      slug: "tangram",
      title: "Tangram",
      emoji: "📐",
      reason: "Basit geometrik parçaları döndürüp birleştirerek yeni şekiller oluştur.",
    },
  ],
};

export const TOPICS: EncyclopediaTopic[] = topicSources.map((topic) => {
  const classification = topicClassification[topic.slug];
  const sources = topicSourcesBySlug[topic.slug];

  if (!classification) {
    throw new Error(`Konu sınıflandırması bulunamadı: ${topic.slug}`);
  }

  if (!sources) {
    throw new Error(`Konu kaynakları bulunamadı: ${topic.slug}`);
  }

  if (sources.length < 2 || sources.length > 3) {
    throw new Error(`Konu için 2–3 kaynak bekleniyor: ${topic.slug}`);
  }

  return {
    slug: topic.slug,
    category: classification.category,
    title: topic.title,
    emoji: topic.icon,
    bigQuestion: topic.bigQuestion,
    summary: topic.summary,
    readingTime: classification.readingTime,
    sections: topic.storySections.map((section) => ({
      title: section.title,
      body: `${section.body} Merak köşesi: ${section.wonder}`,
    })),
    facts: topic.facts.map((fact) => ({
      label: `${fact.icon} Biliyor muydun?`,
      value: fact.title,
      detail: fact.body,
    })),
    glossary: topic.glossary.map((entry) => ({
      term: entry.term,
      meaning: entry.definition,
    })),
    mission: {
      title: `${topic.observation.title} · ${topic.observation.time}`,
      steps: [
        `Hazırla: ${topic.observation.materials.join(", ")}.`,
        ...topic.observation.steps,
        `Sonra düşün: ${topic.observation.think}`,
      ],
      safety: topic.observation.safety,
      parentNote: topic.parentNote,
    },
    quiz: topic.quiz,
    relatedActivities: relatedActivitiesByTopic[topic.slug] ?? [],
    reviewedAt: ENCYCLOPEDIA_REVIEWED_AT,
    sources,
    lab: classification.lab,
  };
});

const TOPIC_BY_SLUG = new Map(TOPICS.map((topic) => [topic.slug, topic]));

export function getTopic(slug: string): EncyclopediaTopic | undefined {
  return TOPIC_BY_SLUG.get(slug);
}
