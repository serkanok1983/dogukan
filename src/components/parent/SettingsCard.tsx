"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { exitParentMode, loginAs, logout } from "@/lib/auth";
import { addDays, daysBetween, dayKey } from "@/lib/progress/time";
import { grantExtension } from "@/lib/sessionClock";
import {
  BREAK_EVERY_OPTIONS,
  BREAK_SECONDS_MAX,
  BREAK_SECONDS_MIN,
  COMPANION_NAMES,
  DEFAULT_SETTINGS,
  updateSettings,
  type Settings,
} from "@/lib/settings";
import { InstallCard } from "@/components/pwa/InstallCard";
import { Card } from "./Card";
import { ChecklistCard } from "./ChecklistCard";

type NumKey =
  | "weekdayMinutes"
  | "weekendMinutes"
  | "arcadeMinutes"
  | "arcadeMaxMinutes"
  | "eveningModeMinutes"
  | "episodesPerDay"
  | "breakSeconds";

type BoolKey =
  | "voiceOn"
  | "soundOn"
  | "hapticsOn"
  | "babaIleEnabled"
  | "rivalVisible"
  | "holidayMode"
  | "firstLaunchDone"
  | "firstBreakDone";

function Field({
  field,
  label,
  hint,
  children,
}: {
  field: keyof Settings;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="parent-field" data-field={field}>
      <div className="parent-field-label">
        <span>{label}</span>
        {hint ? <span className="parent-field-hint">{hint}</span> : null}
      </div>
      <div className="parent-field-control">{children}</div>
    </div>
  );
}

function Stepper({
  s,
  field,
  label,
  min,
  max,
  step,
  unit,
}: {
  s: Settings;
  field: NumKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const value = s[field];
  const set = (v: number) =>
    updateSettings({
      [field]: Math.min(max, Math.max(min, v)),
    } as Partial<Settings>);
  return (
    <Field
      field={field}
      label={label}
      hint={`varsayılan ${DEFAULT_SETTINGS[field]} ${unit}`}
    >
      <button
        type="button"
        className="parent-step"
        aria-label={`${label} azalt`}
        onClick={() => set(value - step)}
        disabled={value <= min}
      >
        −
      </button>
      <output className="parent-step-value" aria-live="polite">
        {value} {unit}
      </output>
      <button
        type="button"
        className="parent-step"
        aria-label={`${label} artır`}
        onClick={() => set(value + step)}
        disabled={value >= max}
      >
        +
      </button>
    </Field>
  );
}

function Toggle({
  s,
  field,
  label,
  hint,
}: {
  s: Settings;
  field: BoolKey;
  label: string;
  hint?: string;
}) {
  return (
    <Field field={field} label={label} hint={hint}>
      <label className="parent-switch">
        <input
          type="checkbox"
          checked={s[field]}
          onChange={(e) =>
            updateSettings({ [field]: e.target.checked } as Partial<Settings>)
          }
        />
        <span>{s[field] ? "Açık" : "Kapalı"}</span>
      </label>
    </Field>
  );
}

export function SettingsCard({
  s,
  now,
  canLog,
}: {
  s: Settings;
  now: number;
  canLog: boolean;
}) {
  const router = useRouter();
  const today = dayKey(now);
  const graceLeft = s.graceUntil
    ? Math.max(0, daysBetween(today, s.graceUntil) + 1)
    : 0;
  const setGraceDays = (n: number) =>
    updateSettings({
      graceUntil: n <= 0 ? addDays(today, -1) : addDays(today, n - 1),
    });

  return (
    <Card id="ayarlar" title="Ayarlar" icon="⚙️">
      <h3 className="parent-sub">Süreler</h3>
      <Stepper
        s={s}
        field="weekdayMinutes"
        label="Hafta içi günlük sınır"
        min={10}
        max={120}
        step={5}
        unit="dk"
      />
      <Stepper
        s={s}
        field="weekendMinutes"
        label="Hafta sonu günlük sınır"
        min={10}
        max={180}
        step={5}
        unit="dk"
      />
      <Toggle
        s={s}
        field="holidayMode"
        label="Tatil modu"
        hint="her gün hafta sonu sınırı"
      />
      <Stepper
        s={s}
        field="arcadeMinutes"
        label="Kavanoz tabanı (arcade)"
        min={0}
        max={60}
        step={2}
        unit="dk"
      />
      <Stepper
        s={s}
        field="arcadeMaxMinutes"
        label="Kavanoz tavanı"
        min={2}
        max={90}
        step={2}
        unit="dk"
      />
      <Field field="breakEveryMinutes" label="Mola aralığı" hint="varsayılan 25 dk">
        <select
          className="parent-select"
          value={s.breakEveryMinutes}
          onChange={(e) =>
            updateSettings({
              breakEveryMinutes: Number(
                e.target.value,
              ) as Settings["breakEveryMinutes"],
            })
          }
        >
          {BREAK_EVERY_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} dk
            </option>
          ))}
        </select>
      </Field>
      <Stepper
        s={s}
        field="breakSeconds"
        label="Mola halkası"
        min={BREAK_SECONDS_MIN}
        max={BREAK_SECONDS_MAX}
        step={5}
        unit="sn"
      />
      <Stepper
        s={s}
        field="episodesPerDay"
        label="Günlük kapsül bölümü"
        min={0}
        max={5}
        step={1}
        unit="bölüm"
      />

      <h3 className="parent-sub">Akşam ve gece</h3>
      <Field field="bedtime" label="Yatma saati" hint="varsayılan 20:30">
        <input
          className="parent-input"
          type="time"
          value={s.bedtime}
          onChange={(e) =>
            e.target.value && updateSettings({ bedtime: e.target.value })
          }
        />
      </Field>
      <Field field="wakeFrom" label="Uyanma saati" hint="varsayılan 07:00">
        <input
          className="parent-input"
          type="time"
          value={s.wakeFrom}
          onChange={(e) =>
            e.target.value && updateSettings({ wakeFrom: e.target.value })
          }
        />
      </Field>
      <Stepper
        s={s}
        field="eveningModeMinutes"
        label="Akşam modu (yatmadan önce)"
        min={0}
        max={120}
        step={10}
        unit="dk"
      />

      <h3 className="parent-sub">Tanışma günleri</h3>
      <Field
        field="graceUntil"
        label="Kavanoz kapı olmadan kalan gün"
        hint={s.graceUntil ? `son gün ${s.graceUntil}` : "henüz ayarlanmadı"}
      >
        <button
          type="button"
          className="parent-step"
          aria-label="Tanışma günü azalt"
          onClick={() => setGraceDays(graceLeft - 1)}
          disabled={graceLeft <= 0}
        >
          −
        </button>
        <output className="parent-step-value">{graceLeft} gün</output>
        <button
          type="button"
          className="parent-step"
          aria-label="Tanışma günü artır"
          onClick={() => setGraceDays(graceLeft + 1)}
          disabled={graceLeft >= 14}
        >
          +
        </button>
        <input
          className="parent-input"
          type="date"
          aria-label="Tanışma son günü"
          value={s.graceUntil}
          onChange={(e) => updateSettings({ graceUntil: e.target.value })}
        />
      </Field>

      <h3 className="parent-sub">Ayı ve ses</h3>
      <Field field="companionName" label="Ayının adı">
        <select
          className="parent-select"
          aria-label="Ayının adı (hazır)"
          value={
            (COMPANION_NAMES as readonly string[]).includes(s.companionName)
              ? s.companionName
              : ""
          }
          onChange={(e) =>
            e.target.value && updateSettings({ companionName: e.target.value })
          }
        >
          <option value="">Özel…</option>
          {COMPANION_NAMES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <input
          className="parent-input"
          type="text"
          maxLength={14}
          aria-label="Ayının adı"
          value={s.companionName}
          onChange={(e) => updateSettings({ companionName: e.target.value })}
          onBlur={(e) =>
            updateSettings({
              companionName: e.target.value.trim() || DEFAULT_SETTINGS.companionName,
            })
          }
        />
      </Field>
      <Toggle s={s} field="voiceOn" label="Sesli okuma" />
      <Toggle s={s} field="soundOn" label="Ses efektleri" />
      <Toggle s={s} field="hapticsOn" label="Titreşim" />

      <h3 className="parent-sub">Aile</h3>
      <Toggle
        s={s}
        field="babaIleEnabled"
        label="“Baba ile” adası"
        hint="dövüş/atış oyunları, yalnızca birlikte"
      />
      <Toggle
        s={s}
        field="rivalVisible"
        label="Babayla rekabet çocuğa görünsün"
        hint="varsayılan kapalı"
      />
      <Toggle s={s} field="firstLaunchDone" label="İlk açılış (ayıya isim) tamam" />
      <Toggle
        s={s}
        field="firstBreakDone"
        label="İlk mola (zıplama) yapıldı"
        hint="kapalıysa sıradaki mola “zıpla”"
      />
      <p className="parent-note" data-field="updatedAt">
        Son değişiklik:{" "}
        {s.updatedAt ? new Date(s.updatedAt).toLocaleString("tr-TR") : "—"}
      </p>

      <h3 className="parent-sub">Şimdi</h3>
      <div className="parent-row">
        <button
          type="button"
          className="parent-btn"
          disabled={!canLog}
          onClick={() => grantExtension(10)}
        >
          ➕ +10 dk şimdi
        </button>
        <button
          type="button"
          className="parent-btn"
          onClick={() => {
            loginAs("serkan");
            router.push("/");
          }}
        >
          👨 Baba olarak oyna
        </button>
        <button
          type="button"
          className="parent-btn"
          onClick={() => {
            exitParentMode();
            router.replace("/");
          }}
        >
          🔒 Ebeveyn modundan çık
        </button>
        <button
          type="button"
          className="parent-btn parent-btn-danger"
          onClick={() => {
            exitParentMode();
            logout();
            router.replace("/");
          }}
        >
          🚪 Çıkış
        </button>
      </div>
      {!canLog ? (
        <p className="parent-note">
          “+10 dk” için bu cihazda Doğukan oturumu açık olmalı.
        </p>
      ) : null}

      <div className="parent-install">
        <InstallCard />
      </div>

      <ChecklistCard s={s} />
    </Card>
  );
}
