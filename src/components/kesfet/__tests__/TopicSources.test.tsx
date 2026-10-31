import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TopicSources } from "@/components/encyclopedia/TopicSources";
import { getTopic } from "@/lib/encyclopedia";

const parent = vi.hoisted(() => ({ mode: false }));
vi.mock("@/lib/auth", () => ({ useParentMode: () => parent.mode }));

const topic = getTopic("isik-ve-golge");
const sources = topic?.sources ?? [];

beforeEach(() => {
  parent.mode = false;
});

afterEach(cleanup);

describe("TopicSources", () => {
  it("renders sources as plain text outside parent mode", () => {
    const { container } = render(
      <TopicSources title="Işık ve gölge" sources={sources} />,
    );
    expect(sources.length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.innerHTML).not.toContain("href");
    for (const source of sources)
      expect(container.textContent).toContain(source.title);
  });

  it("renders links only in parent mode", () => {
    parent.mode = true;
    const { container } = render(
      <TopicSources title="Işık ve gölge" sources={sources} />,
    );
    const links = Array.from(container.querySelectorAll("a"));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(
      sources.map((s) => s.url),
    );
    for (const a of links) expect(a.hasAttribute("target")).toBe(false);
  });
});
