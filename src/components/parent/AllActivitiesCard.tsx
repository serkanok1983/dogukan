import Link from "next/link";
import { getActivityInfo, getWorld } from "@/lib/worlds";
import { Card } from "./Card";
import { allActivities } from "./parentData";

/** 73 etkinliğin tamamı, haritadan gizlenenler dahil (MASTER_PLAN K19). */
export function AllActivitiesCard() {
  const items = allActivities();
  return (
    <Card id="tum-etkinlikler" title={`Tüm etkinlikler (${items.length})`} icon="🗂️">
      <ul className="parent-all">
        {items.map((it) => {
          const info = getActivityInfo(it.slug);
          return (
            <li key={it.slug}>
              <Link href={`/aktivite/${it.slug}/`} className="parent-all-link">
                <span aria-hidden>{it.emoji}</span> {it.label}
                <span className="parent-muted">
                  {info ? ` · ${getWorld(info.world).name}` : ` · ${it.category}`}
                  {info?.hidden ? " · haritada gizli" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
