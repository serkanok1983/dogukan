"use client";

import "./home.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ParentChoice } from "@/components/auth/ParentChoice";
import { ArithmeticGate, ParentGate } from "@/components/auth/ParentGate";
import { ChapterEnd } from "@/components/progress/ChapterEnd";
import { NoticeToaster } from "@/components/progress/NoticeToaster";
import { StickerAlbum } from "@/components/progress/StickerAlbum";
import { SHELL } from "@/content/shell";
import { useProgress } from "@/hooks/useProgress";
import { useWellbeing } from "@/hooks/useWellbeing";
import { trackEvent } from "@/lib/progress/events";
import { ensureTodayQuests } from "@/lib/quests";
import { requestCoplay, setClockContext } from "@/lib/sessionClock";
import { useSettings } from "@/lib/settings";
import { WORLDS, type World } from "@/lib/worlds";
import type { BearPose } from "./BearAvatar";
import { CompanionBar } from "./CompanionBar";
import { ContinueTile } from "./ContinueTile";
import { islandHref, IslandTile } from "./IslandTile";
import {
  grantBabaPass,
  isArcadeWorld,
  islandProgress,
  selectActivities,
  selectBabaEnabled,
  selectChapterNoticeId,
  trackAppOpenOnce,
} from "./mapData";
import { QuestTile } from "./QuestTile";
import { sayOnly } from "./spokenNav";

type Overlay = "none" | "parent" | "parentChoice" | "album" | "baba";

/** Ada haritası (MASTER_PLAN §2.4): CompanionBar, Devam + Görev, 6 ada (+ Baba ile). */
export function WorldMap() {
  const router = useRouter();
  const activities = useProgress(selectActivities);
  const babaEnabled = useSettings(selectBabaEnabled);
  const { evening } = useWellbeing();
  const chapterNoticeId = useProgress(selectChapterNoticeId);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [bearPose, setBearPose] = useState<BearPose | undefined>(undefined);
  // NoticeToaster bildirimi onaylayıp kutudan silse bile ChapterEnd açık kalsın diye kilitlenir.
  const [chapter, setChapter] = useState<{ id: string | null; open: boolean }>({ id: null, open: false });
  if (chapterNoticeId !== null && chapterNoticeId !== chapter.id) {
    setChapter({ id: chapterNoticeId, open: true });
  }

  useEffect(() => {
    setClockContext({ slug: null, kind: "map", running: true });
    ensureTodayQuests();
    trackAppOpenOnce();
    void import("@/lib/activityLog").then((m) => m.logDogukanLogin()).catch(() => undefined);
  }, []);

  const closeChapter = () => {
    if (chapter.id) trackEvent({ type: "notices_ack", ids: [chapter.id] });
    setChapter({ id: chapter.id, open: false });
  };

  const openBabaGate = (world: World) => {
    sayOnly(world.say);
    setOverlay("baba");
  };

  const passBabaGate = () => {
    setOverlay("none");
    grantBabaPass();
    requestCoplay();
    router.push(islandHref("baba"));
  };

  const worlds = WORLDS.filter((w) => w.gated !== "coplay" || babaEnabled);

  return (
    <>
      <div className={evening ? "home-map is-evening" : "home-map"}>
        <CompanionBar
          pose={bearPose}
          onParent={() => setOverlay("parent")}
          onAlbum={() => setOverlay("album")}
        />

        <section className="home-hero" aria-label="Bugün">
          <ContinueTile />
          <QuestTile />
        </section>

        <nav aria-label="Adalar">
          <ul className="home-islands">
            {worlds.map((world) => {
              const { stars, fill } = islandProgress(activities, world.id);
              return (
                <li key={world.id}>
                  <IslandTile
                    world={world}
                    stars={stars}
                    fill={fill}
                    sleeping={evening && isArcadeWorld(world.id)}
                    onActivate={world.gated === "coplay" ? () => openBabaGate(world) : undefined}
                  />
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <NoticeToaster />

      {chapter.open && (
        <ChapterEnd
          onContinue={closeChapter}
          onDone={() => {
            closeChapter();
            setBearPose("sleep");
            sayOnly(SHELL.goodbye);
          }}
        />
      )}
      {overlay === "album" && <StickerAlbum onClose={() => setOverlay("none")} />}
      {overlay === "parent" && (
        <ParentGate onPass={() => setOverlay("parentChoice")} onCancel={() => setOverlay("none")} />
      )}
      {overlay === "parentChoice" && <ParentChoice onClose={() => setOverlay("none")} />}
      {overlay === "baba" && (
        <ArithmeticGate title={SHELL.babaGateTitle} onPass={passBabaGate} onCancel={() => setOverlay("none")} />
      )}
    </>
  );
}
