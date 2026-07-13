import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PitchMatchExercise } from "@/components/exercises/PitchMatchExercise";
import { installAudioMocks } from "./audioMocks";

vi.mock("@/lib/audio/piano", () => ({
  getPiano: vi.fn(async () => ({ triggerAttackRelease: vi.fn() })),
}));

const CONFIG = {
  targetNote: "A4",
  displayNote: "A",
  confidenceThreshold: 0.8,
  timeoutSeconds: 12,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// A "10-minute practice session" is a chain of bounded exercises, so the leak
// vector is per-exercise residue: an AudioContext left open or a mic track
// left live keeps the browser's recording indicator on. Cycle many exercise
// lifetimes and assert every resource is released each time.
describe("audio resource soak", () => {
  it("30 consecutive exercise lifecycles leak no contexts, tracks, or RAF loops", async () => {
    const controller = installAudioMocks();
    controller.signal = { type: "sine", freq: 440 };

    let clock = 0;
    let pendingFrame: FrameRequestCallback | null = null;
    let rafActive = 0;
    vi.spyOn(performance, "now").mockImplementation(() => clock);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      pendingFrame = cb;
      rafActive++;
      return rafActive;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {
      pendingFrame = null;
    });

    for (let cycle = 0; cycle < 30; cycle++) {
      const onComplete = vi.fn();
      const view = render(
        <PitchMatchExercise
          config={CONFIG}
          difficulty="beginner"
          submitted={false}
          onAnswerChange={vi.fn()}
          onComplete={onComplete}
        />
      );

      await userEvent
        .setup({ delay: null })
        .click(screen.getByRole("button", { name: /start singing/i }));
      await act(async () => {});

      // ~1.5s of in-tune frames — enough to pass (1s hold).
      for (let f = 0; f < 25; f++) {
        // Cast: TS flow analysis can't see the assignments inside stubGlobal
        // callbacks and would otherwise narrow pendingFrame to its initial null.
        const frame = pendingFrame as FrameRequestCallback | null;
        if (!frame) break;
        pendingFrame = null;
        clock += 60;
        await act(async () => {
          frame(clock);
        });
      }

      expect(onComplete).toHaveBeenCalledTimes(1);
      view.unmount();

      // Every context ever created is closed; every mic track stopped;
      // no RAF callback left scheduled.
      expect(controller.contexts.every((c) => c.closed)).toBe(true);
      expect(
        controller.streams.every((s) => s.getTracks().every((t) => t.readyState === "ended"))
      ).toBe(true);
      expect(pendingFrame).toBeNull();
    }

    expect(controller.contexts).toHaveLength(30);
    expect(controller.streams).toHaveLength(30);
  });
});
