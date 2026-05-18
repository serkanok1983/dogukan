"use client";

import dynamic from "next/dynamic";
import { QuizGame } from "./shared/QuizGame";
import { CountGame } from "./shared/CountGame";
import { OrderGame } from "./shared/OrderGame";
import { ExplorePanel, type ExploreItem } from "./shared/ExplorePanel";
import { ShapeDraw } from "./shared/ShapeDraw";
import { SymmetryGame } from "./shared/SymmetryGame";
import { TangramLite } from "./shared/TangramLite";
import * as Q from "./data/quizData";

const MemoryGame = dynamic(() => import("./games/MemoryGame").then((m) => m.MemoryGame), { ssr: false });
const SnakeGame = dynamic(() => import("./games/SnakeGame").then((m) => m.SnakeGame), { ssr: false });
const StarCatch = dynamic(() => import("./games/StarCatch").then((m) => m.StarCatch), { ssr: false });
const MazeGame = dynamic(() => import("./games/MazeGame").then((m) => m.MazeGame), { ssr: false });
const BalloonPop = dynamic(() => import("./games/BalloonPop").then((m) => m.BalloonPop), { ssr: false });
const SlidingPuzzle = dynamic(() => import("./games/SlidingPuzzle").then((m) => m.SlidingPuzzle), { ssr: false });
const ColorRace = dynamic(() => import("./games/ColorRace").then((m) => m.ColorRace), { ssr: false });
const SpaceDefense = dynamic(() => import("./games/SpaceDefense").then((m) => m.SpaceDefense), { ssr: false });
const PlatformJump = dynamic(() => import("./games/PlatformJump").then((m) => m.PlatformJump), { ssr: false });
const LaneRacer = dynamic(() => import("./games/LaneRacer").then((m) => m.LaneRacer), { ssr: false });

const GEZEGENLER: ExploreItem[] = [
  { id: "sun", emoji: "☀️", title: "Güneş", fact: "Güneş sistemimizin merkezi. Dünya ve diğer gezegenler onun etrafında döner." },
  { id: "mercury", emoji: "☿️", title: "Merkür", fact: "Güneşe en yakın gezegen. Çok sıcaktır." },
  { id: "venus", emoji: "♀️", title: "Venüs", fact: "Bulutları kalın. Gündüz gökyüzünde bazen görülür." },
  { id: "earth", emoji: "🌍", title: "Dünya", fact: "Evimiz! Su ve hava sayesinde canlılar yaşar." },
  { id: "mars", emoji: "♂️", title: "Mars", fact: "Kızıl gezegen. Üzerinde volkanlar ve kutuplarda buz vardır." },
  { id: "jupiter", emoji: "🪐", title: "Jüpiter", fact: "En büyük gezegen. Büyük Kırmızı Leke bir fırtınadır." },
  { id: "moon", emoji: "🌙", title: "Ay", fact: "Dünya'nın uydusu. Gelgitlere neden olur." },
];

const HAYVANLAR: ExploreItem[] = [
  { id: "aslan", emoji: "🦁", title: "Aslan", fact: "Ormanların kralı. Etçildir, yani et yer." },
  { id: "balik", emoji: "🐟", title: "Balık", fact: "Suda solungaçla nefes alır." },
  { id: "kus", emoji: "🐦", title: "Kuş", fact: "Kanatları ve tüyleri vardır. Çoğu uçar." },
  { id: "ari", emoji: "🐝", title: "Arı", fact: "Çiçeklerden bal yapar. Polinasyona yardım eder." },
];

export const ACTIVITY_MAP: Record<string, () => React.ReactNode> = {
  "uzay-savunma": () => <SpaceDefense />,
  "ziplama-adasi": () => <PlatformJump />,
  "serit-yarisi": () => <LaneRacer />,
  "hafiza-kartlari": () => <MemoryGame />,
  "yilan-oyunu": () => <SnakeGame />,
  "top-yakala": () => <StarCatch />,
  labirent: () => <MazeGame />,
  "balon-patlat": () => <BalloonPop />,
  "renk-yaris": () => <ColorRace />,
  "kaydir-puzzle": () => <SlidingPuzzle />,
  "hizli-matematik": () => <QuizGame questions={Q.hizliMatematik} />,
  "kelime-avcisi": () => <QuizGame questions={Q.kelimeAvcisi} />,
  "hedef-vur": () => <QuizGame questions={Q.hedefVur} />,
  "harf-tanima": () => <QuizGame questions={Q.harfTania} />,
  "hece-birlestir": () => <QuizGame questions={Q.heceBirlestir} />,
  "kelime-okuma": () => <QuizGame questions={Q.kelimeOkuma} />,
  "sesli-harf": () => <QuizGame questions={Q.sesliHarf} />,
  "cumle-kur": () => <QuizGame questions={Q.cumleKur} />,
  "alfabe-sirasi": () => <QuizGame questions={Q.alfabeSirasi} />,
  "benzer-kelime": () => <QuizGame questions={Q.benzerKelime} />,
  "bosluk-doldur": () => <QuizGame questions={Q.boslukDoldur} />,
  "sayma-oyunu": () => <CountGame />,
  "toplama-oyunu": () => <QuizGame questions={Q.toplama} />,
  "cikarma-oyunu": () => <QuizGame questions={Q.cikarma} />,
  "sayi-sirasi": () => <OrderGame items={[3, 7, 1, 9, 5]} />,
  "cift-tek": () => <QuizGame questions={Q.ciftTek} />,
  "onluk-birlik": () => <QuizGame questions={Q.onlukBirlik} />,
  "saat-ogren": () => <QuizGame questions={Q.saatOgren} />,
  "para-say": () => <QuizGame questions={Q.paraSay} />,
  karsilastir: () => <QuizGame questions={Q.karsilastir} />,
  "sekil-tani": () => <QuizGame questions={Q.sekilTani} />,
  "sekil-ciz": () => <ShapeDraw />,
  simetri: () => <SymmetryGame />,
  "desen-tamamla": () => <QuizGame questions={Q.desenTamamla} />,
  "sekil-say": () => <QuizGame questions={Q.sekilSay} />,
  tangram: () => <TangramLite />,
  "hava-durumu": () => <QuizGame questions={Q.havaDurumu} />,
  gezegenler: () => <ExplorePanel items={GEZEGENLER} title="Güneş Sistemi" />,
  vucudumuz: () => <QuizGame questions={Q.vucudumuz} />,
  "besin-gruplari": () => <QuizGame questions={Q.besinGruplari} />,
  "bitki-buyume": () => <QuizGame questions={Q.bitkiBuyume} />,
  hayvanlar: () => <ExplorePanel items={HAYVANLAR} title="Hayvanlar Alemi" />,
  mevsimler: () => <QuizGame questions={Q.mevsimler} />,
  "su-dongu": () => <QuizGame questions={Q.suDongu} />,
  "sira-bul": () => <QuizGame questions={Q.siraBul} />,
  "boyut-sirala": () => <QuizGame questions={Q.boyutSirala} />,
  "mantik-eslestir": () => <QuizGame questions={Q.mantikEslestir} />,
  "fark-bul": () => <QuizGame questions={Q.farkBul} />,
  grupla: () => <QuizGame questions={Q.grupla} />,
};

export function getActivity(slug: string) {
  return ACTIVITY_MAP[slug] ?? null;
}
