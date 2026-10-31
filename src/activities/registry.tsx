"use client";

import dynamic from "next/dynamic";
import { GameSkeleton } from "@/components/game/GameSkeleton";
import { QuizGame } from "./shared/QuizGame";
import { ExplorePanel, type ExploreItem } from "./shared/ExplorePanel";
import { ShapeDraw } from "./shared/ShapeDraw";
import { SymmetryGame } from "./shared/SymmetryGame";
import { TangramLite } from "./shared/TangramLite";
import * as Q from "./data/quizData";

const MemoryGame = dynamic(() => import("./games/MemoryGame").then((m) => m.MemoryGame), { ssr: false, loading: GameSkeleton });
const SnakeGame = dynamic(() => import("./games/SnakeGame").then((m) => m.SnakeGame), { ssr: false, loading: GameSkeleton });
const StarCatch = dynamic(() => import("./games/StarCatch").then((m) => m.StarCatch), { ssr: false, loading: GameSkeleton });
const MazeGame = dynamic(() => import("./games/MazeGame").then((m) => m.MazeGame), { ssr: false, loading: GameSkeleton });
const BalloonPop = dynamic(() => import("./games/BalloonPop").then((m) => m.BalloonPop), { ssr: false, loading: GameSkeleton });
const SlidingPuzzle = dynamic(() => import("./games/SlidingPuzzle").then((m) => m.SlidingPuzzle), { ssr: false, loading: GameSkeleton });
const ColorRace = dynamic(() => import("./games/ColorRace").then((m) => m.ColorRace), { ssr: false, loading: GameSkeleton });
const SpaceDefense = dynamic(() => import("./games/SpaceDefense").then((m) => m.SpaceDefense), { ssr: false, loading: GameSkeleton });
const PlatformJump = dynamic(() => import("./games/PlatformJump").then((m) => m.PlatformJump), { ssr: false, loading: GameSkeleton });
const LaneRacer = dynamic(() => import("./games/LaneRacer").then((m) => m.LaneRacer), { ssr: false, loading: GameSkeleton });
const BubbleBurst = dynamic(() => import("./games/BubbleBurst").then((m) => m.BubbleBurst), { ssr: false, loading: GameSkeleton });
const RunnerDash = dynamic(() => import("./games/RunnerDash").then((m) => m.RunnerDash), { ssr: false, loading: GameSkeleton });
const TankBattle = dynamic(() => import("./games/TankBattle").then((m) => m.TankBattle), { ssr: false, loading: GameSkeleton });
const SuperBear = dynamic(() => import("./games/SuperBear").then((m) => m.SuperBear), { ssr: false, loading: GameSkeleton });
const FlappyBird = dynamic(() => import("./games/FlappyBird").then((m) => m.FlappyBird), { ssr: false, loading: GameSkeleton });
const FightingArena = dynamic(
  () => import("./games/FightingArena").then((m) => m.FightingArena),
  { ssr: false, loading: GameSkeleton },
);
const Tetris = dynamic(() => import("./games/Tetris").then((m) => m.Tetris), { ssr: false, loading: GameSkeleton });
const Pong = dynamic(() => import("./games/Pong").then((m) => m.Pong), { ssr: false, loading: GameSkeleton });
const Asteroids = dynamic(() => import("./games/Asteroids").then((m) => m.Asteroids), { ssr: false, loading: GameSkeleton });
const Breakout = dynamic(() => import("./games/Breakout").then((m) => m.Breakout), { ssr: false, loading: GameSkeleton });
const PinballCadet = dynamic(() => import("./games/PinballCadet").then((m) => m.PinballCadet), { ssr: false, loading: GameSkeleton });
const WhackMole = dynamic(() => import("./games/WhackMole").then((m) => m.WhackMole), { ssr: false, loading: GameSkeleton });

// Faz 1 yeni etkinlikler (CONTRACT §5, §11)
const BlockWorld = dynamic(() => import("./games/blocks/BlockWorld").then((m) => m.BlockWorld), { ssr: false, loading: GameSkeleton });
const DurGit = dynamic(() => import("./games/DurGit").then((m) => m.DurGit), { ssr: false, loading: GameSkeleton });
const ExerciseSession = dynamic(
  () => import("./engine/ExerciseSession").then((m) => m.ExerciseSession),
  { ssr: false, loading: GameSkeleton },
);

// Yeni oyunlar
const ColorWorkshop = dynamic(() => import("./games/ColorWorkshop").then((m) => m.ColorWorkshop), { ssr: false, loading: GameSkeleton });
const FruitSlice = dynamic(() => import("./games/FruitSlice").then((m) => m.FruitSlice), { ssr: false, loading: GameSkeleton });
const TreasureMap = dynamic(() => import("./games/TreasureMap").then((m) => m.TreasureMap), { ssr: false, loading: GameSkeleton });
const RainCatcher = dynamic(() => import("./games/RainCatcher").then((m) => m.RainCatcher), { ssr: false, loading: GameSkeleton });
const AlienInvasion = dynamic(() => import("./games/AlienInvasion").then((m) => m.AlienInvasion), { ssr: false, loading: GameSkeleton });
const DinoDig = dynamic(() => import("./games/DinoDig").then((m) => m.DinoDig), { ssr: false, loading: GameSkeleton });
const RoyalMatch = dynamic(() => import("./games/RoyalMatch").then((m) => m.RoyalMatch), { ssr: false, loading: GameSkeleton });

const GEZEGENLER: ExploreItem[] = [
  { id: "mercury", emoji: "🩶", title: "1 · Merkür", fact: "Güneş'e en yakın gezegen. Gündüzü çok sıcak, gecesi çok soğuk." },
  { id: "venus", emoji: "🟡", title: "2 · Venüs", fact: "En sıcak gezegen. Kalın bulutlar onu battaniye gibi sarar." },
  { id: "earth", emoji: "🌍", title: "3 · Dünya", fact: "Bizim evimiz. Suyu, havası ve canlıları var." },
  { id: "mars", emoji: "🔴", title: "4 · Mars", fact: "Kırmızı gezegen. Toprağı pas rengindedir." },
  { id: "jupiter", emoji: "🟤", title: "5 · Jüpiter", fact: "En büyük gezegen. Üstünde kocaman bir fırtına var." },
  { id: "saturn", emoji: "🪐", title: "6 · Satürn", fact: "Çevresinde buz ve taştan halkalar var." },
  { id: "uranus", emoji: "🩵", title: "7 · Uranüs", fact: "Buz gibi soğuk. Yan yatmış gibi döner." },
  { id: "neptune", emoji: "🔵", title: "8 · Neptün", fact: "Güneş'e en uzak gezegen. Rüzgârı çok hızlı eser." },
];

const HAYVANLAR: ExploreItem[] = [
  { id: "aslan", emoji: "🦁", title: "Aslan", fact: "Afrika'da yaşar. Ailesiyle birlikte dolaşır." },
  { id: "balik", emoji: "🐟", title: "Balık", fact: "Suda solungaçla nefes alır." },
  { id: "kus", emoji: "🐦", title: "Kuş", fact: "Kanatları ve tüyleri vardır. Çoğu uçar." },
  { id: "ari", emoji: "🐝", title: "Arı", fact: "Çiçeklerden bal yapar. Çiçeklere de yardım eder." },
];

export const ACTIVITY_MAP: Record<string, () => React.ReactNode> = {
  "super-ayi": () => <SuperBear />,
  "flappy-bird": () => <FlappyBird />,
  "dovus-arenasi": () => <FightingArena />,
  tetris: () => <Tetris />,
  pong: () => <Pong />,
  asteroids: () => <Asteroids />,
  "tugla-kir": () => <Breakout />,
  "pinball-space-cadet": () => <PinballCadet />,
  "tank-savasi": () => <TankBattle />,
  "uzay-savunma": () => <SpaceDefense />,
  "ziplama-adasi": () => <PlatformJump />,
  "serit-yarisi": () => <LaneRacer />,
  "baloncuk-patlat": () => <BubbleBurst />,
  "kosu-macera": () => <RunnerDash />,
  "hafiza-kartlari": () => <MemoryGame />,
  "yilan-oyunu": () => <SnakeGame />,
  "top-yakala": () => <StarCatch />,
  labirent: () => <MazeGame />,
  "balon-patlat": () => <BalloonPop />,
  "renk-yaris": () => <ColorRace />,
  "kostebek-vur": () => <WhackMole />,
  "kaydir-puzzle": () => <SlidingPuzzle />,
  "hizli-matematik": () => <QuizGame questions={Q.hizliMatematik} />,
  "kelime-avcisi": () => <QuizGame questions={Q.kelimeAvcisi} />,
  "hedef-vur": () => <QuizGame questions={Q.hedefVur} />,
  "harf-tanima": () => <ExerciseSession slug="harf-tanima" skill="tr.ses-harf" />,
  "hece-birlestir": () => <QuizGame questions={Q.heceBirlestir} />,
  "kelime-okuma": () => <ExerciseSession slug="kelime-okuma" skill="tr.kelime" />,
  "sesli-harf": () => <QuizGame questions={Q.sesliHarf} />,
  "cumle-kur": () => <QuizGame questions={Q.cumleKur} />,
  "alfabe-sirasi": () => <QuizGame questions={Q.alfabeSirasi} />,
  "benzer-kelime": () => <QuizGame questions={Q.benzerKelime} />,
  "bosluk-doldur": () => <QuizGame questions={Q.boslukDoldur} />,
  "sayma-oyunu": () => <ExerciseSession slug="sayma-oyunu" skill="mat.sayma" />,
  "toplama-oyunu": () => <ExerciseSession slug="toplama-oyunu" skill="mat.toplama" />,
  "cikarma-oyunu": () => <ExerciseSession slug="cikarma-oyunu" skill="mat.cikarma" />,
  "sayi-sirasi": () => <ExerciseSession slug="sayi-sirasi" skill="mat.sira" />,
  "cift-tek": () => <QuizGame questions={Q.ciftTek} />,
  "onluk-birlik": () => <QuizGame questions={Q.onlukBirlik} />,
  "saat-ogren": () => <QuizGame questions={Q.saatOgren} />,
  "para-say": () => <QuizGame questions={Q.paraSay} />,
  karsilastir: () => <QuizGame questions={Q.karsilastir} />,
  "sekil-tani": () => <QuizGame questions={Q.sekilTani} />,
  "sekil-ciz": () => <ShapeDraw />,
  simetri: () => <SymmetryGame />,
  "desen-tamamla": () => <ExerciseSession slug="desen-tamamla" skill="mat.oruntu" />,
  "sekil-say": () => <QuizGame questions={Q.sekilSay} />,
  tangram: () => <TangramLite />,
  "hava-durumu": () => <QuizGame questions={Q.havaDurumu} />,
  gezegenler: () => <ExplorePanel items={GEZEGENLER} title="Güneş Sistemi'nin Sekiz Gezegeni" />,
  vucudumuz: () => <QuizGame questions={Q.vucudumuz} />,
  "besin-gruplari": () => <QuizGame questions={Q.besinGruplari} />,
  "bitki-buyume": () => <QuizGame questions={Q.bitkiBuyume} />,
  hayvanlar: () => <ExplorePanel items={HAYVANLAR} title="Hayvanlar Alemi" />,
  mevsimler: () => <QuizGame questions={Q.mevsimler} />,
  "su-dongu": () => <QuizGame questions={Q.suDongu} />,
  "sira-bul": () => <ExerciseSession slug="sira-bul" skill="mat.oruntu" />,
  "boyut-sirala": () => <QuizGame questions={Q.boyutSirala} />,
  "mantik-eslestir": () => <QuizGame questions={Q.mantikEslestir} />,
  "fark-bul": () => <QuizGame questions={Q.farkBul} />,
  grupla: () => <QuizGame questions={Q.grupla} />,
  // Yeni oyunlar
  "renk-atolyesi": () => <ColorWorkshop />,
  "harf-yazma": () => <ExerciseSession slug="harf-yazma" skill="tr.harf-yaz" />,
  "meyve-bicagi": () => <FruitSlice />,
  "hazine-haritasi": () => <TreasureMap />,
  "yagmur-damlasi": () => <RainCatcher />,
  "uzayli-istilasi": () => <AlienInvasion />,
  "dinozor-kazi": () => <DinoDig />,
  "royal-match": () => <RoyalMatch />,
  // Faz 1 yeni etkinlikler
  "ses-avi": () => <ExerciseSession slug="ses-avi" skill="tr.ses-ayirt" />,
  "guvenli-yol": () => <ExerciseSession slug="guvenli-yol" skill="hb.guvenli" />,
  "dur-git": () => <DurGit />,
  "blok-dunyasi": () => <BlockWorld />,
};

export function getActivity(slug: string) {
  return ACTIVITY_MAP[slug] ?? null;
}
