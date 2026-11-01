import { beforeEach, describe, expect, it } from "vitest";
import { loginAs, logout } from "@/lib/auth";
import { trackEvent } from "@/lib/progress/events";
import { _resetProgressForTests } from "@/lib/progress/store";
import { loadContinueRecord } from "../mapData";

beforeEach(() => {
  logout();
  _resetProgressForTests();
  localStorage.clear();
  sessionStorage.clear();
});

describe("loadContinueRecord (rekor kutucuğu)", () => {
  it("oturum yoksa 0", async () => {
    await expect(loadContinueRecord()).resolves.toBe(0);
  });

  it("oturumdaki oyuncunun rekoru (Doğukan sabit değil)", async () => {
    localStorage.setItem("dogukan-scores-dogukan", JSON.stringify({ "super-ayi": 300 }));
    localStorage.setItem("dogukan-scores-serkan", JSON.stringify({ "super-ayi": 4200 }));
    loginAs("serkan");
    await expect(loadContinueRecord()).resolves.toBe(4200);
    await expect(loadContinueRecord("dogukan")).resolves.toBe(300);
  });

  it("yerel skor tablosu (Firebase önbelleği dahil) ile ilerleme `best`inin büyüğü", async () => {
    loginAs("dogukan");
    trackEvent({ type: "run_end", slug: "super-ayi", score: 750, durationMs: 1, level: 3 });
    await expect(loadContinueRecord()).resolves.toBe(750);
    // leaderboard.ts uzak yüksek skoru bu anahtara önbellekler.
    localStorage.setItem("dogukan-scores-dogukan", JSON.stringify({ "super-ayi": 1200 }));
    await expect(loadContinueRecord()).resolves.toBe(1200);
  });
});
