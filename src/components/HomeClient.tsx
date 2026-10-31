"use client";

import { WhoIsPlaying } from "@/components/auth/WhoIsPlaying";
import { NameTheBear } from "@/components/home/NameTheBear";
import { selectFirstLaunchDone } from "@/components/home/mapData";
import { WorldMap } from "@/components/home/WorldMap";
import { useSession } from "@/lib/auth";
import { useSettings } from "@/lib/settings";

/**
 * Ana sayfanın istemci katmanı: giriş yoksa "Kim oynuyor?", ilk açılışta
 * ayıya isim verme, sonra ada haritası. Oturum hazır olana kadar hiçbir şey
 * çizmez; o sırada sunucu iskeleti (`HomeSkeleton`) görünür.
 */
export function HomeClient() {
  const { ready, player } = useSession();
  const firstLaunchDone = useSettings(selectFirstLaunchDone);

  if (!ready) return null;

  return (
    <div className="home-live">
      {!player ? (
        <WhoIsPlaying />
      ) : player === "dogukan" && !firstLaunchDone ? (
        <NameTheBear />
      ) : (
        <WorldMap />
      )}
    </div>
  );
}
