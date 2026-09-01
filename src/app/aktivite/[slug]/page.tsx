import { notFound } from "next/navigation";
import { findActivity, MENU } from "@/lib/menu";
import { getActivityLearning } from "@/lib/activityLearning";
import { ActivityClient } from "./ActivityClient";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return MENU.flatMap((cat) => cat.items.map((item) => ({ slug: item.slug })));
}

export default async function AktivitePage({ params }: Props) {
  const { slug } = await params;
  const meta = findActivity(slug);

  if (!meta) notFound();

  return (
    <ActivityClient
      slug={slug}
      title={meta.label}
      learning={getActivityLearning(slug)}
    />
  );
}
