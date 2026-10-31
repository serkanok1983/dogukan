import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IslandScreen } from "@/components/home/IslandScreen";
import { WORLDS } from "@/lib/worlds";

type Props = { params: Promise<{ world: string }> };

// Statik dışa aktarım: yalnızca WORLDS içindeki adalar üretilir, gerisi 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return WORLDS.map((w) => ({ world: w.id }));
}

function findWorld(id: string) {
  return WORLDS.find((w) => w.id === id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const world = findWorld((await params).world);
  return world ? { title: world.name } : {};
}

export default async function AdaPage({ params }: Props) {
  const world = findWorld((await params).world);
  if (!world) notFound();
  return <IslandScreen worldId={world.id} />;
}
