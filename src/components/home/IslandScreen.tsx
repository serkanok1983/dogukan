"use client";

import "./home.css";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ParentGate } from "@/components/auth/ParentGate";
import { SayButton } from "@/components/SayButton";
import { SHELL } from "@/content/shell";
import { useProgress } from "@/hooks/useProgress";
import { useWellbeing } from "@/hooks/useWellbeing";
import { useParentMode, useSession } from "@/lib/auth";
import { EPISODES, episodeHref } from "@/lib/capsules";
import { findActivity } from "@/lib/menu";
import { isCoplayActive, requestCoplay, setClockContext } from "@/lib/sessionClock";
import { useSettings } from "@/lib/settings";
import {
  activitiesInWorld,
  getActivityInfo,
  getWorld,
  type WorldId,
} from "@/lib/worlds";
import {
  grantBabaPass,
  hasBabaPass,
  paginate,
  selectActivities,
  selectBabaEnabled,
  selectTopics,
} from "./mapData";
import { sayOnly, useSpokenNav } from "./spokenNav";
import { SpokenTile, StarRow } from "./SpokenTile";

const TILES_PER_PAGE = 12;

type TileEntry = {
  key: string;
  href: string;
  emoji: string;
  label: string;
  stars?: number;
  done?: boolean;
  sleeping?: boolean;
};

function noopSubscribe(): () => void {
  return () => {};
}

function readCoplayPass(): boolean {
  return isCoplayActive() || hasBabaPass();
}

function serverFalse(): boolean {
  return false;
}

/** Ada ekranı: tek ekranda en fazla 12 kutucuk; fazlası yana kaydırılan sayfalarda. */
export function IslandScreen({ worldId }: { worldId: WorldId }) {
  const world = getWorld(worldId);
  const router = useRouter();
  const go = useSpokenNav();
  const session = useSession();
  const activities = useProgress(selectActivities);
  const topics = useProgress(selectTopics);
  const { evening } = useWellbeing();
  const babaEnabled = useSettings(selectBabaEnabled);
  const parentMode = useParentMode();
  const coplayPass = useSyncExternalStore(
    noopSubscribe,
    readCoplayPass,
    serverFalse,
  );
  const [gatePassed, setGatePassed] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClockContext({ slug: null, kind: "map", running: true });
  }, []);

  useEffect(() => {
    if (session.ready && !session.player) router.replace("/");
  }, [session.ready, session.player, router]);

  const gated = world.gated === "coplay";
  const locked = gated && !(babaEnabled && (coplayPass || parentMode || gatePassed));

  const entries: TileEntry[] = [
    ...(worldId === "merak"
      ? EPISODES.map((ep) => ({
          key: `kapsul:${ep.topic}`,
          href: episodeHref(ep.topic),
          emoji: ep.emoji,
          label: ep.title,
          done: topics[ep.topic]?.capsuleDone ?? false,
        }))
      : []),
    ...activitiesInWorld(worldId).map((slug) => {
      const meta = findActivity(slug);
      return {
        key: slug,
        href: `/aktivite/${slug}/`,
        emoji: meta?.emoji ?? "🎲",
        label: meta?.label ?? slug,
        stars: activities[slug]?.stars ?? 0,
        sleeping: evening && getActivityInfo(slug)?.kind === "arcade",
      };
    }),
  ];
  const pages = paginate(entries, TILES_PER_PAGE);

  const scrollToPage = (i: number) => {
    const el = pagesRef.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <div
      className={evening ? "home-island-screen is-evening" : "home-island-screen"}
      style={{ "--tile-accent": world.accent } as CSSProperties}
    >
      <header className="home-island-head">
        <Link
          href="/"
          className="home-back"
          aria-label={SHELL.map}
          onClick={(e) => {
            e.preventDefault();
            go(SHELL.map, "/");
          }}
        >
          <span aria-hidden>🗺️</span>
        </Link>
        <h1 className="home-island-title">
          <span aria-hidden>{world.emoji}</span> {world.name}
        </h1>
        <SayButton text={world.say} />
      </header>

      {locked ? (
        <section className="home-gate-card">
          <span className="home-gate-emoji" aria-hidden>
            {world.emoji}
          </span>
          <p className="home-gate-text">
            {babaEnabled ? SHELL.babaGateSay : SHELL.babaOff}
          </p>
          <SayButton text={babaEnabled ? SHELL.babaGateSay : SHELL.babaOff} />
          {babaEnabled && (
            <button
              type="button"
              className="home-big-btn"
              onClick={() => {
                sayOnly(SHELL.babaCall);
                setGateOpen(true);
              }}
            >
              <span aria-hidden>🔔</span> {SHELL.babaCall}
            </button>
          )}
        </section>
      ) : (
        <>
          <div
            ref={pagesRef}
            className="home-pages"
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.clientWidth > 0)
                setPage(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {pages.map((items, i) => (
              <ul
                key={i}
                className="home-grid"
                aria-label={pages.length > 1 ? `Sayfa ${i + 1}` : undefined}
              >
                {items.map((t) => (
                  <li key={t.key}>
                    <SpokenTile
                      href={t.href}
                      emoji={t.emoji}
                      label={t.label}
                      className={t.sleeping ? "home-act is-sleeping" : "home-act"}
                      badge={t.sleeping ? "💤" : t.done ? "✓" : undefined}
                      onActivate={
                        t.sleeping
                          ? () => sayOnly(SHELL.activitySleeping)
                          : undefined
                      }
                    >
                      {t.stars !== undefined && <StarRow stars={t.stars} />}
                    </SpokenTile>
                  </li>
                ))}
              </ul>
            ))}
          </div>

          {pages.length > 1 && (
            <div className="home-pager">
              <button
                type="button"
                className="home-pager-btn"
                aria-label="Önceki sayfa"
                disabled={page === 0}
                onClick={() => scrollToPage(page - 1)}
              >
                <span aria-hidden>◀</span>
              </button>
              <span className="home-pager-dots" aria-hidden>
                {pages.map((_, i) => (
                  <span
                    key={i}
                    className={
                      i === page ? "home-pager-dot is-on" : "home-pager-dot"
                    }
                  />
                ))}
              </span>
              <button
                type="button"
                className="home-pager-btn"
                aria-label="Sonraki sayfa"
                disabled={page >= pages.length - 1}
                onClick={() => {
                  sayOnly(SHELL.morePages);
                  scrollToPage(page + 1);
                }}
              >
                <span aria-hidden>▶</span>
              </button>
            </div>
          )}
        </>
      )}

      {gateOpen && (
        <ParentGate
          onPass={() => {
            setGateOpen(false);
            setGatePassed(true);
            grantBabaPass();
            requestCoplay();
          }}
          onCancel={() => setGateOpen(false)}
        />
      )}
    </div>
  );
}
