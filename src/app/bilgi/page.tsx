"use client";

import { useRouter } from "next/navigation";
import { ParentGate } from "@/components/auth/ParentGate";
import { ParentDashboard } from "@/components/parent/ParentDashboard";
import { useParentMode, useSession } from "@/lib/auth";

/** Ebeveyn paneli: ParentGate (aritmetik → PIN) geçilmeden hiçbir veri gösterilmez. */
export default function BilgiPage() {
  const router = useRouter();
  const { ready } = useSession();
  const parent = useParentMode();

  if (!ready) return null;
  if (!parent) {
    return (
      <ParentGate onPass={() => undefined} onCancel={() => router.replace("/")} />
    );
  }
  return <ParentDashboard />;
}
