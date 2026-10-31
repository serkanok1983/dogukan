import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginAs, logout } from "@/lib/auth";
import {
  countCompleted,
  readEncyclopediaProgress,
  updateEncyclopediaProgress,
} from "@/lib/encyclopediaProgress";
import { onEvent } from "@/lib/progress/events";
import { _resetProgressForTests, getProgress } from "@/lib/progress/store";

const LEGACY_KEY = "dogukan-merak-ansiklopedisi-v1";

beforeEach(() => {
  // Reset first: logout() persists the in-memory state of the previous test.
  _resetProgressForTests();
  logout();
  localStorage.clear();
});

describe("encyclopediaProgress adapter", () => {
  it("writes favourite/complete as topic_flag events into progress.topics", () => {
    loginAs("dogukan");
    const flags = vi.fn();
    const off = onEvent("topic_flag", flags);
    const changed = vi.fn();
    window.addEventListener("dogukan-encyclopedia-progress", changed);

    updateEncyclopediaProgress("miknatislar", { favorite: true });
    updateEncyclopediaProgress("miknatislar", { complete: true });

    expect(flags).toHaveBeenCalledTimes(2);
    expect(flags.mock.calls[0]?.[0]).toMatchObject({
      type: "topic_flag",
      slug: "miknatislar",
      favorite: true,
    });
    expect(flags.mock.calls[0]?.[0]).not.toHaveProperty("complete");
    expect(changed).toHaveBeenCalledTimes(2);
    expect(getProgress().topics.miknatislar).toMatchObject({
      favorite: true,
      complete: true,
    });

    const read = readEncyclopediaProgress();
    expect(read.miknatislar).toMatchObject({ favorite: true, complete: true });
    expect(countCompleted(read)).toBe(1);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();

    off();
    window.removeEventListener("dogukan-encyclopedia-progress", changed);
  });

  it("records a visit as a flagless topic_flag and reads lastVisited from lastAt", () => {
    loginAs("dogukan");
    updateEncyclopediaProgress("isik-ve-golge", {
      lastVisited: new Date().toISOString(),
    });
    const topic = getProgress().topics["isik-ve-golge"];
    expect(topic).toMatchObject({ favorite: false, complete: false });
    expect(topic?.lastAt).toBeGreaterThan(0);
    expect(readEncyclopediaProgress()["isik-ve-golge"]?.lastVisited).toBe(
      new Date(topic?.lastAt ?? 0).toISOString(),
    );
  });

  it("falls back to the legacy key when nobody is logged in", () => {
    updateEncyclopediaProgress("gece-ve-gunduz", { favorite: true });
    expect(JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "{}")).toEqual({
      "gece-ve-gunduz": { favorite: true },
    });
    expect(readEncyclopediaProgress()["gece-ve-gunduz"]?.favorite).toBe(true);
  });
});
