import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CapsuleGate } from "@/components/kesfet/CapsuleGate";
import { EPISODES, getEpisode } from "@/lib/capsules";
import { CATEGORIES, getTopic } from "@/lib/encyclopedia";

type Props = { params: Promise<{ slug: string }> };

// Static export: only topics that have an episode get a /kapsul/ page.
export const dynamicParams = false;

export function generateStaticParams() {
  return EPISODES.map((episode) => ({ slug: episode.topic }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const episode = getEpisode(slug);
  if (!episode) return {};
  return { title: `${episode.title} · Merak Kapsülü` };
}

export default async function CapsulePage({ params }: Props) {
  const { slug } = await params;
  const episode = getEpisode(slug);
  if (!episode) notFound();
  const topic = getTopic(slug);
  const color = CATEGORIES.find((item) => item.id === topic?.category)?.color;
  return <CapsuleGate episode={episode} color={color} />;
}
