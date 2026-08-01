"use client";

import { useMemo, useState } from "react";
import type { EncyclopediaTopic } from "@/lib/encyclopedia";
import { sounds } from "@/lib/sounds";

type Props = { mode: EncyclopediaTopic["lab"] };

const SENSES = [
  { emoji: "👁️", name: "Görme", organ: "göz", clue: "Işığı, rengi, biçimi ve hareketi fark ederiz." },
  { emoji: "👂", name: "İşitme", organ: "kulak", clue: "Havadaki titreşimleri ses olarak algılarız." },
  { emoji: "👃", name: "Koklama", organ: "burun", clue: "Havadaki bazı molekülleri ayırt ederiz." },
  { emoji: "👅", name: "Tatma", organ: "dil", clue: "Tat tomurcuklarımız farklı tatlara tepki verir." },
  { emoji: "🖐️", name: "Dokunma", organ: "deri", clue: "Basınç, sıcaklık ve yüzey özelliklerini hissederiz." },
] as const;

const HABITATS = [
  { id: "forest", label: "Orman", emoji: "🌳", animal: "🦉", fact: "Baykuş, ağaçları yuva ve avlanma yeri olarak kullanabilir." },
  { id: "sea", label: "Deniz", emoji: "🌊", animal: "🐟", fact: "Balıkların solungaçları sudaki çözünmüş oksijeni almaya yardım eder." },
  { id: "desert", label: "Çöl", emoji: "🏜️", animal: "🦎", fact: "Birçok çöl canlısı su kaybını azaltan özelliklere sahiptir." },
  { id: "polar", label: "Kutup", emoji: "🧊", animal: "🐧", fact: "Kalın yağ veya tüy tabakası bazı canlıların ısı kaybını azaltır." },
] as const;

const WATER_STEPS = [
  { emoji: "☀️💧", title: "Buharlaşma", text: "Güneşten gelen enerji, sıvı suyun bir bölümünün su buharına dönüşmesine yardım eder." },
  { emoji: "☁️", title: "Yoğunlaşma", text: "Yükselen su buharı soğuduğunda küçük su damlacıkları oluşabilir." },
  { emoji: "🌧️", title: "Yağış", text: "Damlacıklar ya da buz kristalleri büyüyüp ağırlaşınca yağmur veya kar olarak düşebilir." },
  { emoji: "🏞️", title: "Toplanma ve akış", text: "Su; toprağa sızar, akarsulara katılır veya göl ve denizlerde toplanır." },
] as const;

const MOON_PHASES = [
  ["🌑", "Yeni ay", "Ay’ın aydınlık yüzünün çok azını görürüz."],
  ["🌒", "Büyüyen hilal", "Görünen aydınlık bölüm her gece biraz artar."],
  ["🌓", "İlk dördün", "Ay diskinin yaklaşık yarısı aydınlık görünür."],
  ["🌔", "Büyüyen şişkin ay", "Aydınlık bölüm yarıdan fazladır."],
  ["🌕", "Dolunay", "Dünya’ya bakan yüzün neredeyse tamamı aydınlık görünür."],
  ["🌖", "Küçülen şişkin ay", "Aydınlık bölüm azalmaya başlar."],
  ["🌗", "Son dördün", "Diskin yaklaşık diğer yarısı aydınlık görünür."],
  ["🌘", "Küçülen hilal", "Yeni aydan önce ince bir aydınlık bölüm kalır."],
] as const;

const SHAPES = [
  {
    id: "square",
    symbol: "■",
    name: "Kare",
    sides: "4 eşit kenar",
    corners: "4 köşe",
    symmetry: "4 simetri doğrusu",
  },
  {
    id: "rectangle",
    symbol: "▭",
    name: "Dikdörtgen",
    sides: "4 kenar",
    corners: "4 köşe",
    symmetry: "2 simetri doğrusu",
  },
  {
    id: "triangle",
    symbol: "▲",
    name: "Eşkenar üçgen",
    sides: "3 eşit kenar",
    corners: "3 köşe",
    symmetry: "3 simetri doğrusu",
  },
  {
    id: "circle",
    symbol: "○",
    name: "Çember",
    sides: "düz kenar yok",
    corners: "köşe yok",
    symmetry: "sonsuz simetri doğrusu",
  },
] as const;

function RangeControl({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="lab-range">
      <span>
        {label}
        <output>{value}{unit}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function InteractiveLab({ mode }: Props) {
  const [value, setValue] = useState(mode === "body" ? 72 : 50);
  const [value2, setValue2] = useState(45);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);

  const title = {
    senses: "Duyu dedektifi",
    body: "Kalp ve nefes gözlemcisi",
    plant: "Bitki bakım deneyi",
    habitat: "Canlı–yaşam alanı eşleştirmesi",
    weather: "Hava gözlem istasyonu",
    water: "Bir damlanın yolculuğu",
    orbit: "Gece–gündüz modeli",
    moon: "Ay’ın görünüşleri",
    matter: "Tanecik hareketi",
    light: "Işık ve gölge sahnesi",
    motion: "İtme ve sürtünme pisti",
    magnet: "Mıknatıs uzaklık deneyi",
    number: "Sayı doğrusu adımları",
    shape: "Şekil ve örüntü atölyesi",
  }[mode];

  return (
    <section className={`mini-science-lab lab-${mode}`} aria-labelledby={`lab-${mode}-title`}>
      <div className="mini-lab-heading">
        <span aria-hidden>🧪</span>
        <div>
          <small>Dokun · değiştir · gözle</small>
          <h2 id={`lab-${mode}-title`}>{title}</h2>
        </div>
      </div>
      {mode === "senses" ? <SensesLab step={step} setStep={setStep} /> : null}
      {mode === "body" ? (
        <BodyLab rate={value} setRate={setValue} breathing={active} setBreathing={setActive} />
      ) : null}
      {mode === "plant" ? (
        <PlantLab light={value} setLight={setValue} water={value2} setWater={setValue2} />
      ) : null}
      {mode === "habitat" ? <HabitatLab step={step} setStep={setStep} /> : null}
      {mode === "weather" ? (
        <WeatherLab temperature={value - 25} setTemperature={(next) => setValue(next + 25)} wind={value2} setWind={setValue2} />
      ) : null}
      {mode === "water" ? <WaterLab step={step} setStep={setStep} /> : null}
      {mode === "orbit" ? <OrbitLab angle={value * 3.6} setAngle={(next) => setValue(next / 3.6)} /> : null}
      {mode === "moon" ? <MoonLab step={step} setStep={setStep} /> : null}
      {mode === "matter" ? (
        <MatterLab energy={value} setEnergy={setValue} />
      ) : null}
      {mode === "light" ? <LightLab angle={value} setAngle={setValue} /> : null}
      {mode === "motion" ? (
        <MotionLab push={value} setPush={setValue} friction={value2} setFriction={setValue2} active={active} setActive={setActive} />
      ) : null}
      {mode === "magnet" ? <MagnetLab distance={Math.max(1, Math.round(value / 8))} setDistance={(next) => setValue(next * 8)} /> : null}
      {mode === "number" ? (
        <NumberLab
          start={Math.round(value / 10)}
          setStart={(next) => setValue(next * 10)}
          jump={Math.round(value2 / 10)}
          setJump={(next) => setValue2(next * 10)}
        />
      ) : null}
      {mode === "shape" ? (
        <ShapeLab
          step={step}
          setStep={setStep}
          showSymmetry={active}
          setShowSymmetry={setActive}
        />
      ) : null}
    </section>
  );
}

function SensesLab({ step, setStep }: { step: number; setStep: (step: number) => void }) {
  const sense = SENSES[step] ?? SENSES[0];
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage senses-stage" aria-live="polite">
        <span className="lab-main-emoji" aria-hidden>{sense.emoji}</span>
        <strong>{sense.name}</strong>
        <p><b>{sense.organ[0]?.toLocaleUpperCase("tr")}{sense.organ.slice(1)}</b> ile {sense.clue.toLocaleLowerCase("tr")}</p>
      </div>
      <div className="mini-lab-controls">
        <p>Bir duyuya dokun. Beyin, farklı organlardan gelen bilgileri birlikte yorumlar.</p>
        <div className="choice-row">
          {SENSES.map((item, index) => (
            <button
              type="button"
              key={item.name}
              className={step === index ? "active" : ""}
              aria-pressed={step === index}
              onClick={() => { sounds.tap(); setStep(index); }}
            >
              <span aria-hidden>{item.emoji}</span>{item.name}
            </button>
          ))}
        </div>
        <p className="observation-note">Gözlem: Bir yiyeceği tanırken görme, koklama, tatma ve dokunma birlikte çalışabilir.</p>
      </div>
    </div>
  );
}

function BodyLab({
  rate,
  setRate,
  breathing,
  setBreathing,
}: {
  rate: number;
  setRate: (rate: number) => void;
  breathing: boolean;
  setBreathing: (active: boolean) => void;
}) {
  const tempo = Math.max(0.42, 60 / rate);
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage body-stage" aria-live="polite">
        <span
          className="beating-heart"
          style={{ "--beat-speed": `${tempo}s` } as React.CSSProperties}
          aria-hidden
        >
          ❤️
        </span>
        <span className={`breathing-lungs ${breathing ? "is-breathing" : ""}`} aria-hidden>🫁</span>
        <strong>Yaklaşık {rate} atım / dakika</strong>
        <p>Kalp kanı pompalar; akciğerler havayla kan arasında gaz alışverişine yardım eder.</p>
      </div>
      <div className="mini-lab-controls">
        <RangeControl label="Kalp modeli hızı" min={50} max={140} value={rate} unit=" atım/dk" onChange={setRate} />
        <button type="button" className="lab-action" onClick={() => { sounds.tap(); setBreathing(!breathing); }}>
          {breathing ? "Nefes modelini durdur" : "Yavaş nefes modelini başlat"}
        </button>
        <p className="observation-note">Koşarken kasların daha çok oksijen ve enerjiye ihtiyaç duyar; kalp ve soluk alıp verme genellikle hızlanır.</p>
      </div>
    </div>
  );
}

function PlantLab({
  light,
  setLight,
  water,
  setWater,
}: {
  light: number;
  setLight: (value: number) => void;
  water: number;
  setWater: (value: number) => void;
}) {
  const balance = 100 - Math.min(100, Math.abs(light - 65) + Math.abs(water - 55));
  const state = balance > 72 ? ["🌻", "Dengeli koşullar"] : balance > 42 ? ["🌱", "Büyüme yavaş"] : ["🥀", "Koşullar uygun değil"];
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage plant-stage" aria-live="polite">
        <span className="plant-sun" aria-hidden>☀️</span>
        <span className="lab-main-emoji plant-emoji" style={{ "--plant-size": `${0.8 + balance / 180}` } as React.CSSProperties} aria-hidden>{state[0]}</span>
        <strong>{state[1]}</strong>
        <p>Bitki; ışık enerjisi, su ve havadaki karbondioksiti kullanarak şeker üretir.</p>
      </div>
      <div className="mini-lab-controls">
        <RangeControl label="Işık" min={0} max={100} value={light} unit="%" onChange={setLight} />
        <RangeControl label="Su" min={0} max={100} value={water} unit="%" onChange={setWater} />
        <p className="observation-note">Azı kadar fazlası da sorun olabilir: Kökler suyla dolu toprakta yeterli oksijen bulamayabilir.</p>
      </div>
    </div>
  );
}

function HabitatLab({ step, setStep }: { step: number; setStep: (step: number) => void }) {
  const habitat = HABITATS[step] ?? HABITATS[0];
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage habitat-stage" aria-live="polite">
        <span className="habitat-backdrop" aria-hidden>{habitat.emoji}</span>
        <span className="habitat-animal" aria-hidden>{habitat.animal}</span>
        <strong>{habitat.label}</strong>
        <p>{habitat.fact}</p>
      </div>
      <div className="mini-lab-controls">
        <p>Bir yaşam alanı seç ve canlının orada işine yarayan özelliğini düşün.</p>
        <div className="choice-row">
          {HABITATS.map((item, index) => (
            <button type="button" key={item.id} className={step === index ? "active" : ""} aria-pressed={step === index} onClick={() => { sounds.tap(); setStep(index); }}>
              <span aria-hidden>{item.emoji}</span>{item.label}
            </button>
          ))}
        </div>
        <p className="observation-note">Uyum sağlayan özellikler bireyin isteğiyle oluşmaz; kalıtsal çeşitlilik ve kuşaklar boyunca seçilim önemlidir.</p>
      </div>
    </div>
  );
}

function WeatherLab({
  temperature,
  setTemperature,
  wind,
  setWind,
}: {
  temperature: number;
  setTemperature: (value: number) => void;
  wind: number;
  setWind: (value: number) => void;
}) {
  const symbol = wind > 65 ? "🌬️" : temperature <= 0 ? "❄️" : temperature > 28 ? "🌡️" : "🌤️";
  const label = wind > 65
    ? "Rüzgâr güçlü"
    : temperature <= 0
      ? "Donma noktası veya altı"
      : temperature > 28
        ? "Sıcaklık yüksek"
        : "Sıcaklık ılıman";
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage weather-stage" aria-live="polite">
        <span className="lab-main-emoji" aria-hidden>{symbol}</span>
        <strong>{label}: {temperature} °C</strong>
        <p>Hava durumu; sıcaklık, rüzgâr, nem, basınç ve yağış gibi birlikte ölçülen özelliklerle anlatılır.</p>
      </div>
      <div className="mini-lab-controls">
        <RangeControl label="Sıcaklık" min={-20} max={40} value={temperature} unit=" °C" onChange={setTemperature} />
        <RangeControl label="Rüzgâr modeli" min={0} max={100} value={wind} unit="%" onChange={setWind} />
        <p className="observation-note">Bu iki ölçüm tek başına yağışı göstermez; gerçek hava durumunu anlamak için nem, basınç ve bulutlar gibi başka kanıtlar da gerekir.</p>
      </div>
    </div>
  );
}

function WaterLab({ step, setStep }: { step: number; setStep: (step: number) => void }) {
  const current = WATER_STEPS[step] ?? WATER_STEPS[0];
  return (
    <div className="mini-lab-layout">
      <div className={`mini-lab-stage water-stage water-step-${step}`} aria-live="polite">
        <span className="lab-main-emoji" aria-hidden>{current.emoji}</span>
        <strong>{current.title}</strong>
        <p>{current.text}</p>
      </div>
      <div className="mini-lab-controls">
        <div className="step-track" aria-label={`Su döngüsü: ${step + 1}. aşama`}>
          {WATER_STEPS.map((item, index) => (
            <button type="button" key={item.title} className={step === index ? "active" : ""} aria-current={step === index ? "step" : undefined} onClick={() => { sounds.tap(); setStep(index); }}>
              <span>{index + 1}</span>{item.title}
            </button>
          ))}
        </div>
        <p className="observation-note">Su kaybolmaz; yeri ve fiziksel hâli değişir. Döngünün tek bir başlangıç noktası yoktur.</p>
      </div>
    </div>
  );
}

function OrbitLab({ angle, setAngle }: { angle: number; setAngle: (value: number) => void }) {
  const localHour = Math.round((angle / 360) * 24) % 24;
  const daylight = localHour >= 6 && localHour < 18;
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage orbit-stage" aria-live="polite">
        <span className="model-sun" aria-hidden>☀️</span>
        <span className="model-rays" aria-hidden>→ → →</span>
        <span className="model-earth" style={{ "--earth-angle": `${angle}deg` } as React.CSSProperties} aria-hidden>🌍</span>
        <strong>{daylight ? "Modelde gündüz" : "Modelde gece"} · yaklaşık {String(localHour).padStart(2, "0")}:00</strong>
        <p>Dünya kendi ekseni çevresinde döndükçe bulunduğumuz yer sırayla Güneş’e dönük ve ters tarafta kalır.</p>
      </div>
      <div className="mini-lab-controls">
        <RangeControl label="Dünya’yı döndür" min={0} max={360} value={Math.round(angle)} unit="°" onChange={setAngle} />
        <p className="observation-note">Gece, Güneş’in sönmesi değildir. Dünya’nın Güneş’e dönük olmayan tarafında bulunuruz.</p>
      </div>
    </div>
  );
}

function MoonLab({ step, setStep }: { step: number; setStep: (step: number) => void }) {
  const phase = MOON_PHASES[step] ?? MOON_PHASES[0];
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage moon-stage" aria-live="polite">
        <span className="lab-main-emoji moon-emoji" aria-hidden>{phase[0]}</span>
        <strong>{phase[1]}</strong>
        <p>{phase[2]}</p>
      </div>
      <div className="mini-lab-controls">
        <label className="lab-range">
          <span>Ay’ın yörüngesindeki görünüm<output>{step + 1} / 8</output></span>
          <input type="range" min={0} max={7} value={step} onChange={(event) => setStep(Number(event.target.value))} />
        </label>
        <p className="observation-note">Ay kendi ışığını üretmez. Gördüğümüz şekil, Güneş’in aydınlattığı yarının Dünya’dan görünen bölümüdür.</p>
      </div>
    </div>
  );
}

function MatterLab({ energy, setEnergy }: { energy: number; setEnergy: (value: number) => void }) {
  const state = energy < 34 ? "Katı" : energy < 68 ? "Sıvı" : "Gaz";
  const energyLabel = energy < 34 ? "düşük enerji" : energy < 68 ? "orta enerji" : "yüksek enerji";
  const particleCount = 18;
  return (
    <div className="mini-lab-layout">
      <div className={`mini-lab-stage matter-stage state-${state.toLocaleLowerCase("tr")}`} aria-live="polite">
        <div className="particle-box" style={{ "--matter-energy": Math.max(0.2, energy / 45) } as React.CSSProperties} aria-hidden>
          {Array.from({ length: particleCount }, (_, index) => <i key={index} />)}
        </div>
        <strong>{state} tanecik modeli · {energyLabel}</strong>
        <p>{state === "Katı" ? "Tanecikler birbirine yakın konumlarda titreşir." : state === "Sıvı" ? "Tanecikler yakın kalır ama birbirlerinin yanından geçebilir." : "Tanecikler birbirinden uzakta ve daha serbest hareket eder."}</p>
      </div>
      <div className="mini-lab-controls">
        <RangeControl label="Taneciklerin enerji düzeyi" min={0} max={100} value={energy} unit="%" onChange={setEnergy} />
        <p className="observation-note">Bu, gerçek bir sıcaklık ölçeği değil tanecik davranışını anlatan basit bir modeldir; gerçek tanecikler gözle görülemeyecek kadar küçüktür.</p>
      </div>
    </div>
  );
}

function LightLab({ angle, setAngle }: { angle: number; setAngle: (value: number) => void }) {
  const safeAngle = Math.max(10, Math.min(90, angle));
  const shadow = Math.round(220 / Math.tan((safeAngle * Math.PI) / 180));
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage shadow-stage" style={{ "--light-angle": `${safeAngle - 50}deg`, "--shadow-length": `${Math.min(190, shadow)}px` } as React.CSSProperties} aria-live="polite">
        <span className="shadow-sun" aria-hidden>☀️</span>
        <span className="shadow-object" aria-hidden>🌳</span>
        <span className="cast-shadow" aria-hidden />
        <strong>{safeAngle < 35 ? "Uzun gölge" : safeAngle > 65 ? "Kısa gölge" : "Orta uzunlukta gölge"}</strong>
        <p>Işık daha alçak bir açıyla geldiğinde cisim arkasındaki gölge genellikle uzar.</p>
      </div>
      <div className="mini-lab-controls">
        <RangeControl label="Işığın geliş açısı" min={10} max={85} value={safeAngle} unit="°" onChange={setAngle} />
        <p className="observation-note">Gölge, ışığın bir cisim tarafından engellendiği bölgede oluşur; gölge kendi başına bir madde değildir.</p>
      </div>
    </div>
  );
}

function MotionLab({
  push,
  setPush,
  friction,
  setFriction,
  active,
  setActive,
}: {
  push: number;
  setPush: (value: number) => void;
  friction: number;
  setFriction: (value: number) => void;
  active: boolean;
  setActive: (active: boolean) => void;
}) {
  const distance = useMemo(() => Math.max(2, Math.round(push * (1.15 - friction / 110))), [friction, push]);
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage motion-stage" aria-live="polite">
        <div className="motion-track" aria-hidden>
          <span className={active ? "rolling-ball is-moving" : "rolling-ball"} style={{ "--travel": `${Math.min(88, distance)}%` } as React.CSSProperties}>⚽</span>
        </div>
        <strong>Model uzaklığı: {distance} adım</strong>
        <p>Daha güçlü bir itme hareketi artırabilir; yüzeyle etkileşim olan sürtünme ise hareketi azaltabilir.</p>
      </div>
      <div className="mini-lab-controls">
        <RangeControl label="İtme" min={10} max={100} value={push} unit="%" onChange={(next) => { setActive(false); setPush(next); }} />
        <RangeControl label="Sürtünme" min={0} max={100} value={friction} unit="%" onChange={(next) => { setActive(false); setFriction(next); }} />
        <button type="button" className="lab-action" onClick={() => { sounds.jump(); setActive(false); requestAnimationFrame(() => setActive(true)); }}>
          Topu it
        </button>
      </div>
    </div>
  );
}

function MagnetLab({ distance, setDistance }: { distance: number; setDistance: (value: number) => void }) {
  const clips = Math.max(0, 6 - Math.floor(distance / 2));
  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage magnet-stage" aria-live="polite">
        <span className="model-magnet" style={{ "--magnet-gap": `${distance * 8}px` } as React.CSSProperties} aria-hidden>🧲</span>
        <span className="paperclips" aria-hidden>{Array.from({ length: clips }, () => "📎").join("") || "· · ·"}</span>
        <strong>{clips ? `${clips} ataş modele yaklaştı` : "Bu model uzaklığında hareket yok"}</strong>
        <p>Mıknatısın etkisi uzaklık arttıkça genellikle zayıflar. Her metal de mıknatısa güçlü biçimde çekilmez.</p>
      </div>
      <div className="mini-lab-controls">
        <RangeControl label="Mıknatıs–ataş uzaklığı" min={1} max={12} value={distance} unit=" adım" onChange={setDistance} />
        <p className="observation-note">Ev deneyi için yalnız sıradan mıknatıs ve ataş kullan; mıknatısı elektronik cihazlardan uzak tut.</p>
      </div>
    </div>
  );
}

function NumberLab({
  start,
  setStart,
  jump,
  setJump,
}: {
  start: number;
  setStart: (value: number) => void;
  jump: number;
  setJump: (value: number) => void;
}) {
  const result = start + jump;

  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage number-stage" aria-live="polite">
        <strong className="number-equation">
          {start} + {jump} = {result}
        </strong>
        <p>
          {jump === 0
            ? `${start} sayısından sıfır adım ilerleyince yine ${start} sayısında kalırsın.`
            : `${start} sayısından başlayıp ${jump} eşit adım sağa gidince ${result} sayısına ulaşırsın.`}
        </p>
        <div className="number-line-scroll" aria-hidden>
          <div className="number-track">
            {Array.from({ length: 16 }, (_, point) => {
              const className = [
                point === start ? "is-start" : "",
                point === result ? "is-result" : "",
                point > start && point < result ? "is-path" : "",
              ].filter(Boolean).join(" ");

              return (
                <span className={className} key={point}>
                  <i />
                  <b>{point}</b>
                </span>
              );
            })}
          </div>
        </div>
        <div className="number-legend" aria-hidden>
          <span><i className="start-dot" />Başlangıç</span>
          <span><i className="result-dot" />Sonuç</span>
        </div>
      </div>
      <div className="mini-lab-controls">
        <RangeControl
          label="Başlangıç sayısı"
          min={0}
          max={10}
          value={start}
          onChange={setStart}
        />
        <RangeControl
          label="Sağa doğru adım"
          min={0}
          max={5}
          value={jump}
          unit=" adım"
          onChange={setJump}
        />
        <p className="observation-note">
          Sayı doğrusu eşit aralıklıdır. Bir adım her yerde bir sayılık değişimi
          gösterir; sıfır adım ise başlangıç sayısını değiştirmez.
        </p>
      </div>
    </div>
  );
}

function ShapeLab({
  step,
  setStep,
  showSymmetry,
  setShowSymmetry,
}: {
  step: number;
  setStep: (value: number) => void;
  showSymmetry: boolean;
  setShowSymmetry: (value: boolean) => void;
}) {
  const shape = SHAPES[step] ?? SHAPES[0];

  return (
    <div className="mini-lab-layout">
      <div className="mini-lab-stage shape-stage" aria-live="polite">
        <div className={`shape-model shape-${shape.id}`} aria-hidden>
          <span>{shape.symbol}</span>
          {showSymmetry ? <i className="shape-symmetry-axis" /> : null}
        </div>
        <strong>{shape.name}</strong>
        <p>
          {shape.sides}, {shape.corners}; {shape.symmetry}.
        </p>
        <div className="shape-pattern" aria-hidden>
          <span>{shape.symbol}</span>
          <span>★</span>
          <span>{shape.symbol}</span>
          <span>★</span>
          <span className="pattern-answer">?</span>
        </div>
        <p>
          Tekrar eden birim “{shape.name}–yıldız”. Sıradaki parça:{" "}
          <b>{shape.name}</b>.
        </p>
      </div>
      <div className="mini-lab-controls">
        <p>
          Şekli değiştir; kenar ve köşe özelliklerini karşılaştır. Çizgi
          açıldığında katlanan iki yarının eşleşip eşleşmeyeceğini düşün.
        </p>
        <div className="choice-row">
          {SHAPES.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={step === index ? "active" : ""}
              aria-pressed={step === index}
              onClick={() => {
                sounds.tap();
                setStep(index);
              }}
            >
              <span aria-hidden>{item.symbol}</span>
              {item.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="lab-action"
          aria-pressed={showSymmetry}
          onClick={() => {
            sounds.tap();
            setShowSymmetry(!showSymmetry);
          }}
        >
          {showSymmetry ? "Simetri doğrusunu gizle" : "Bir simetri doğrusu göster"}
        </button>
        <p className="observation-note">
          Gösterilen çizgi olası simetri doğrularından yalnız biridir. Şekli
          döndürmek kenar ve köşe sayılarını değiştirmez.
        </p>
      </div>
    </div>
  );
}
