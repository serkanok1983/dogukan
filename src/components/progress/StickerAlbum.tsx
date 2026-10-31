"use client";

/**
 * Çıkartma albümü + ayı rafı (CONTRACT §10.4, MASTER_PLAN §2.7). Sahibi S5.
 * - Sahip olunan çıkartmalar renkli; kilitliler gri silüet + "?".
 * - Sahip olunan çıkartmaya dokununca adı söylenir.
 * - Raf: kozmetikler yalnız yıldızla alınır (fiyat ⭐ ile gösterilir) ve takılır.
 */
import "./progress.css";
import { useEffect } from "react";
import { BearAvatar } from "@/components/home/BearAvatar";
import { useProgress } from "@/hooks/useProgress";
import { COSMETICS, starsAvailable, type CosmeticDef } from "@/lib/cosmetics";
import { trackEvent } from "@/lib/progress/events";
import type { Progress } from "@/lib/progress/types";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { STICKER_PAGES, STICKERS, type StickerDef } from "@/lib/stickers";

const OPEN_LINE = "Çıkartma albümün!";
const LOCKED_LINE = "Bu çıkartma seni bekliyor.";

const selectStickers = (p: Progress) => p.rewards.stickers;
const selectCosmetics = (p: Progress) => p.rewards.cosmetics;
const selectAvailable = (p: Progress) => starsAvailable(p);

function StickerCard({ def, owned }: { def: StickerDef; owned: boolean }) {
  return (
    <button
      type="button"
      className={owned ? "pr-sticker is-owned" : "pr-sticker is-locked"}
      onClick={() => speak(owned ? def.name : LOCKED_LINE)}
      aria-label={owned ? def.name : "Kilitli çıkartma"}
    >
      <span className="pr-sticker-emoji" aria-hidden>
        {def.emoji}
      </span>
      {!owned && (
        <span className="pr-sticker-lock" aria-hidden>
          ?
        </span>
      )}
    </button>
  );
}

export function StickerAlbum(props: { onClose: () => void }) {
  const { onClose } = props;
  const stickers = useProgress(selectStickers);
  const cosmetics = useProgress(selectCosmetics);
  const available = useProgress(selectAvailable);
  const ownedCount = STICKERS.filter((d) => stickers[d.id] !== undefined).length;

  useEffect(() => {
    speak(OPEN_LINE);
  }, []);

  const tapCosmetic = (c: CosmeticDef) => {
    const owned = cosmetics.owned.includes(c.id);
    if (owned) {
      const equipped = cosmetics.equipped === c.id;
      trackEvent({ type: "cosmetic_equip", cosmeticId: equipped ? null : c.id });
      sounds.tap();
      speak(equipped ? "Çıkardın." : `${c.say}! Ayına yakıştı.`);
      return;
    }
    if (available < c.price) {
      sounds.softWrong();
      speak(`${c.price} yıldız lazım. Oynadıkça toplarsın.`);
      return;
    }
    trackEvent({ type: "cosmetic_buy", cosmeticId: c.id, price: c.price });
    trackEvent({ type: "cosmetic_equip", cosmeticId: c.id });
    sounds.sticker();
    speak(`${c.say}! Ayına yakıştı.`);
  };

  return (
    <div className="pr-album" role="dialog" aria-modal="true" aria-label={OPEN_LINE}>
      <div className="pr-album-card">
        <header className="pr-album-head">
          <button
            type="button"
            className="pr-chip"
            onClick={() => speak(`${ownedCount} çıkartman var.`)}
            aria-label={`${ownedCount} çıkartma`}
          >
            🃏 {ownedCount}/{STICKERS.length}
          </button>
          <button
            type="button"
            className="pr-chip pr-album-stars"
            onClick={() => speak(`${available} yıldızın var.`)}
            aria-label={`${available} yıldız`}
          >
            ⭐ {available}
          </button>
          <button
            type="button"
            className="pr-close"
            onClick={onClose}
            aria-label="Kapat"
          >
            ✕
          </button>
        </header>

        <section className="pr-shelf" aria-label="Ayının rafı">
          <BearAvatar size={72} cosmetic={cosmetics.equipped} />
          <ul className="pr-shelf-list">
            {COSMETICS.map((c) => {
              const owned = cosmetics.owned.includes(c.id);
              const equipped = cosmetics.equipped === c.id;
              const affordable = owned || available >= c.price;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`pr-cosmetic${owned ? " is-owned" : ""}${equipped ? " is-equipped" : ""}${affordable ? "" : " is-dim"}`}
                    onClick={() => tapCosmetic(c)}
                    aria-label={owned ? c.name : `${c.name}, ${c.price} yıldız`}
                    aria-pressed={equipped}
                  >
                    <span className="pr-cosmetic-emoji" aria-hidden>
                      {c.emoji}
                    </span>
                    <span className="pr-cosmetic-tag" aria-hidden>
                      {equipped ? "✓" : owned ? "👆" : `⭐${c.price}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="pr-pages">
          {STICKER_PAGES.map((page) => {
            const defs = STICKERS.filter((d) => d.page === page);
            if (defs.length === 0) return null;
            return (
              <section key={page} className="pr-page" aria-label={page}>
                <h3 className="pr-page-head">
                  <button
                    type="button"
                    className="pr-page-title"
                    onClick={() => speak(page)}
                  >
                    {page}
                  </button>
                </h3>
                <div className="pr-sticker-grid">
                  {defs.map((d) => (
                    <StickerCard
                      key={d.id}
                      def={d}
                      owned={stickers[d.id] !== undefined}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
