import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { numberWord } from "@/activities/engine/numbers";
import { normalizeExercise } from "@/activities/engine/plan";
import type { RendererProps } from "@/activities/engine/rendererTypes";
import { TapCount } from "@/activities/engine/TapCount";
import type { Exercise } from "@/activities/engine/types";

afterEach(cleanup);

function exercise(n: number): Exercise {
  const ex = normalizeExercise({
    id: "t1",
    skill: "mat.sayma",
    level: 1,
    kind: "tapcount",
    prompt: { say: "Kaç elma var? Her birine dokun.", visual: { type: "count", emoji: "🍎", n, layout: "rows5" } },
    answerIds: [String(n)],
    feedback: { retry: "Bir daha say.", reveal: `${n} elma.` },
  });
  if (!ex) throw new Error("geçersiz");
  return ex;
}

function setup(n: number) {
  const onAnswer = vi.fn();
  const say = vi.fn();
  const props: RendererProps = {
    ex: exercise(n),
    phase: "ask",
    faded: [],
    wrong: [],
    disabled: false,
    onAnswer,
    say,
  };
  render(<TapCount {...props} />);
  return { onAnswer, say };
}

describe("TapCount", () => {
  it("her nesneye bir kez dokunulur, ses Türkçe sayar, sonra sayı seçilir", () => {
    const { onAnswer, say } = setup(3);
    const objects = () => screen.getAllByRole("button", { pressed: false });
    expect(objects()).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "üç" })).toBeNull();

    const first = objects()[0] as HTMLElement;
    fireEvent.click(first);
    fireEvent.click(first); // ikinci dokunuş sayılmaz
    fireEvent.click(objects()[0] as HTMLElement);
    fireEvent.click(objects()[0] as HTMLElement);

    expect(say.mock.calls.map((c) => c[0])).toEqual(["bir", "iki", "üç"]);
    fireEvent.click(screen.getByRole("button", { name: "üç" }));
    expect(onAnswer).toHaveBeenCalledWith(["3"]);
  });

  it("seçenek yoksa n-1, n, n+1 üretilir", () => {
    const ex = exercise(4);
    expect(ex.choices?.map((c) => c.id)).toEqual(["3", "4", "5"]);
    expect(ex.choices?.map((c) => c.say)).toEqual(["üç", "dört", "beş"]);
  });
});

describe("numberWord", () => {
  it("Türkçe sayı adları", () => {
    expect([0, 1, 10, 11, 17, 20, 21, 99, 100, 345].map(numberWord)).toEqual([
      "sıfır",
      "bir",
      "on",
      "on bir",
      "on yedi",
      "yirmi",
      "yirmi bir",
      "doksan dokuz",
      "yüz",
      "üç yüz kırk beş",
    ]);
  });
});
