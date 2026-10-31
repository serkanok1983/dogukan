"use client";

import { listSharedBuilds } from "@/activities/games/blocks/storage";
import { Card } from "./Card";

export function GalleryCard() {
  const builds = listSharedBuilds("dogukan").filter((b) =>
    /^data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+$/.test(b.thumb),
  );
  return (
    <Card id="galeri" title="Blok galerisi" icon="🧱">
      {builds.length === 0 ? (
        <p className="parent-muted">“Babaya göster” denmiş bir yapı yok.</p>
      ) : (
        <ul className="parent-gallery">
          {builds.map((b) => (
            <li key={b.index} className="parent-build">
              <span
                className="parent-build-thumb"
                role="img"
                aria-label={b.name}
                style={{ backgroundImage: `url("${b.thumb}")` }}
              />
              <span className="parent-build-name">{b.name}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
