import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  enterParentMode,
  exitParentMode,
  getPinLockRemainingMs,
  getPlayerId,
  isLoggedIn,
  isParentMode,
  isParentPinConfigured,
  loginAs,
  logout,
  setLoggedIn,
  verifyParentPin,
} from "@/lib/auth";

describe("oturum: baba girişi sekmeye özel, Doğukan kalıcı", () => {
  beforeEach(() => {
    logout();
    localStorage.clear();
    sessionStorage.clear();
  });

  /** Yeni sekme / PWA açılışı: sessionStorage boş, localStorage ortak. */
  const newLaunch = () => sessionStorage.clear();

  it("loginAs('dogukan') kalıcıdır: yeni açılış Doğukan olarak başlar", () => {
    loginAs("dogukan");
    expect(localStorage.getItem("dogukan-player")).toBe("dogukan");
    newLaunch();
    expect(getPlayerId()).toBe("dogukan");
    expect(isLoggedIn()).toBe(true);
  });

  it("loginAs('serkan') yalnızca bu sekmede; yeni açılış asla baba olarak başlamaz", () => {
    loginAs("serkan");
    expect(getPlayerId()).toBe("serkan");
    expect(localStorage.getItem("dogukan-player")).toBeNull();
    expect(localStorage.getItem("dogukan-logged-in")).toBeNull();
    newLaunch();
    expect(getPlayerId()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });

  it("baba bu sekmede oynarken cihazdaki Doğukan girişi korunur", () => {
    loginAs("dogukan");
    loginAs("serkan");
    expect(getPlayerId()).toBe("serkan");
    expect(localStorage.getItem("dogukan-player")).toBe("dogukan");
    newLaunch();
    expect(getPlayerId()).toBe("dogukan");
  });

  it("eski setLoggedIn('serkan', true) da kalıcı yazmaz", () => {
    setLoggedIn("serkan", true);
    expect(localStorage.getItem("dogukan-player")).toBeNull();
    expect(getPlayerId()).toBe("serkan");
  });

  it("göç: localStorage'daki kalıcı baba girişi silinir, açılış 'Kim oynuyor?' olur", () => {
    // Önceki sürümün "Oturumu açık tut" ya da eski loginAs("serkan") kaydı.
    localStorage.setItem("dogukan-logged-in", "true");
    localStorage.setItem("dogukan-player", "serkan");
    expect(isLoggedIn()).toBe(false);
    expect(getPlayerId()).toBeNull();
    expect(localStorage.getItem("dogukan-logged-in")).toBeNull();
    expect(localStorage.getItem("dogukan-player")).toBeNull();
  });

  it("göç, bu sekmedeki etkin baba oturumunu kapatmaz", () => {
    sessionStorage.setItem("dogukan-logged-in", "true");
    sessionStorage.setItem("dogukan-player", "serkan");
    localStorage.setItem("dogukan-logged-in", "true");
    localStorage.setItem("dogukan-player", "serkan");
    expect(getPlayerId()).toBe("serkan");
    expect(isLoggedIn()).toBe(true);
    expect(localStorage.getItem("dogukan-player")).toBeNull();
    newLaunch();
    expect(getPlayerId()).toBeNull();
  });
});

const SALT = "deneme-tuzu";
const PIN = "4826";

function hashOf(pin: string, salt: string): string {
  return createHash("sha256").update(`${pin}:${salt}`).digest("hex");
}

describe("ebeveyn PIN'i", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PIN_SALT", SALT);
    vi.stubEnv("NEXT_PUBLIC_PARENT_PIN_HASH", hashOf(PIN, SALT));
    // Yalnızca Date sahte: crypto.subtle sözleri gerçek mikro görevlerde çözülsün.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-31T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("doğru PIN kabul edilir", async () => {
    expect(isParentPinConfigured()).toBe(true);
    await expect(verifyParentPin(PIN)).resolves.toBe(true);
    expect(getPinLockRemainingMs()).toBe(0);
  });

  it("hash büyük harfle verilse de doğrular", async () => {
    vi.stubEnv("NEXT_PUBLIC_PARENT_PIN_HASH", hashOf(PIN, SALT).toUpperCase());
    await expect(verifyParentPin(PIN)).resolves.toBe(true);
  });

  it("3 hatalı deneme 30 sn kilitler; kilitteyken doğru PIN de reddedilir", async () => {
    await expect(verifyParentPin("0000")).resolves.toBe(false);
    await expect(verifyParentPin("1111")).resolves.toBe(false);
    expect(getPinLockRemainingMs()).toBe(0);
    await expect(verifyParentPin("2222")).resolves.toBe(false);
    expect(getPinLockRemainingMs()).toBe(30_000);
    expect(
      JSON.parse(localStorage.getItem("dogukan-pin-lock") ?? "null"),
    ).toMatchObject({ fails: 0 });

    await expect(verifyParentPin(PIN)).resolves.toBe(false);

    vi.setSystemTime(new Date("2026-10-31T10:00:29Z"));
    expect(getPinLockRemainingMs()).toBe(1_000);
    await expect(verifyParentPin(PIN)).resolves.toBe(false);

    vi.setSystemTime(new Date("2026-10-31T10:00:31Z"));
    expect(getPinLockRemainingMs()).toBe(0);
    await expect(verifyParentPin(PIN)).resolves.toBe(true);
    expect(localStorage.getItem("dogukan-pin-lock")).toBeNull();
  });

  it("başarılı giriş hata sayacını sıfırlar", async () => {
    await verifyParentPin("0000");
    await verifyParentPin("1111");
    await verifyParentPin(PIN);
    await verifyParentPin("2222");
    expect(getPinLockRemainingMs()).toBe(0);
  });

  it("hash yoksa PIN ayarlanmamış sayılır ve hiçbir PIN geçmez", async () => {
    vi.stubEnv("NEXT_PUBLIC_PARENT_PIN_HASH", "");
    expect(isParentPinConfigured()).toBe(false);
    await expect(verifyParentPin(PIN)).resolves.toBe(false);
    expect(localStorage.getItem("dogukan-pin-lock")).toBeNull();
  });
});

describe("ebeveyn modu", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("varsayılan 15 dk sürer, sessionStorage'a yazılır ve çıkılabilir", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-31T10:00:00Z"));
    expect(isParentMode()).toBe(false);
    enterParentMode();
    expect(isParentMode()).toBe(true);
    expect(Number(sessionStorage.getItem("dogukan-parent-until"))).toBe(
      Date.now() + 15 * 60_000,
    );

    vi.setSystemTime(new Date("2026-10-31T10:15:01Z"));
    expect(isParentMode()).toBe(false);

    enterParentMode(1);
    expect(isParentMode()).toBe(true);
    exitParentMode();
    expect(isParentMode()).toBe(false);
  });
});
