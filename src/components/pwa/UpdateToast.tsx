"use client";

import { SayButton } from "@/components/SayButton";

type Props = { onUpdate: () => void };

/** "Yeni oyunlar hazır" bildirimi (S8). Yalnızca haritada gösterilir, oyun ortasında asla. */
export function UpdateToast({ onUpdate }: Props) {
  return (
    <div className="pwa-toast" role="status">
      <button type="button" className="pwa-toast-main" onClick={onUpdate}>
        Yeni oyunlar hazır — dokun ✨
      </button>
      <SayButton text="Yeni oyunlar hazır. Dokun." />
    </div>
  );
}
