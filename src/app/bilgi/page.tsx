"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BubbleBg } from "@/components/BubbleBg";
import { ParentInfoScreen } from "@/components/ParentInfoScreen";
import { getPlayerId, isLoggedIn } from "@/lib/auth";

export default function BilgiPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/");
      return;
    }
    if (getPlayerId() !== "serkan") {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <>
      <BubbleBg />
      <div className="sky-gradient" aria-hidden />
      <div className="shell shell-info">
        <ParentInfoScreen />
      </div>
    </>
  );
}
