import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PitchMatchExercise } from "@/components/exercises/PitchMatchExercise";
import type { ExerciseResult } from "@/components/exercises/ExerciseEngine";
import { installAudioMocks, type AudioTestController } from "./audioMocks";

// Piano playback (tone.js) is irrelevant here and doesn't run in jsdom.
vi.mock("@/lib/audio/piano", () => ({
  getPiano: vi.fn(async () => ({ triggerAttackRelease: vi.fn() })),
}));

const A4_CONFIG = {
  targetNote: "A4",
  displayNote: "A",
  confidenceThreshold: 0.8,
  timeoutSeconds: 12,
};

// ---- Controlled clock + RAF pump -------------------------------------------
let clock = 0;
let pendingFrame: FrameRequestCallback | null = null;

function installFrameClock() {
  clock = 0;
  pendingFrame = null;
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    pendingFrame = cb;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    pendingFrame = null;
  });
}

/** Advance the fake clock and run queued animation frames. */
async function advanceFrames(count: number, dtMs: number) {
  for (let i = 0; i < count; i++) {
    const frame = pendingFrame;
    if (!frame) return;
    pendingFrame = null;
    clock += dtMs;
    await act(async () => {
      frame(clock);
    });
  }
}
// -----------------------------------------------------------------------------

let controller: AudioTestController;
let onComplete: Mock<(r: ExerciseResult) => void>;

function renderExercise(mockOptions: Parameters<typeof installAudioMocks>[0] = {}) {
  controller = installAudioMocks(mockOptions);
  installFrameClock();
  onComplete = vi.fn();
  return render(
    <PitchMatchExercise
      config={A4_CONFIG}
      difficulty="beginner"
      submitted={false}
      onAnswerChange={vi.fn()}
      onComplete={(r: ExerciseResult) => onComplete(r)}
    />
  );
}

async function startSinging() {
  await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: /start singing/i }));
  // Let the getUserMedia promise settle and the listening phase mount.
  await act(async () => {});
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PitchMatchExercise — happy path with synthetic audio", () => {
  it("does NOT create an AudioContext before the user gesture (Safari/iOS rule)", async () => {
    renderExercise();
    expect(controller.contexts).toHaveLength(0);
    controller.signal = { type: "sine", freq: 440 };
    await startSinging();
    expect(controller.contexts).toHaveLength(1);
  });

  it("in-tune 440 Hz sine held ≥1s passes with score 100", async () => {
    renderExercise();
    controller.signal = { type: "sine", freq: 440 };
    await startSinging();
    // Beginner hold = 1s. 25 frames × 60ms = 1.5s of in-tune audio.
    await advanceFrames(25, 60);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ score: 100, passed: true });
    expect(screen.getByText(/nailed it/i)).toBeInTheDocument();
  });

  it("octave below the target (220 Hz vs A4) also passes — octave-agnostic by design", async () => {
    renderExercise();
    controller.signal = { type: "sine", freq: 220 };
    await startSinging();
    await advanceFrames(25, 60);
    expect(onComplete).toHaveBeenCalledWith({ score: 100, passed: true });
  });

  it("stops the mic tracks and closes the AudioContext after passing", async () => {
    renderExercise();
    controller.signal = { type: "sine", freq: 440 };
    await startSinging();
    await advanceFrames(25, 60);
    expect(controller.streams[0].getTracks()[0].stop).toHaveBeenCalled();
    expect(controller.contexts[0].close).toHaveBeenCalled();
  });
});

describe("PitchMatchExercise — out-of-tune and edge signals", () => {
  it("a semitone sharp (466.16 Hz, +100¢) never passes; times out with a failing score", async () => {
    renderExercise();
    controller.signal = { type: "sine", freq: 466.16 };
    await startSinging();
    // Ride out the full 12s timeout: 121 frames × 100ms.
    await advanceFrames(125, 100);
    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(70); // passingScore floor — never a pass
  });

  it("silence for the whole window fails without crashing (score 0)", async () => {
    renderExercise();
    controller.signal = { type: "silence" };
    await startSinging();
    await advanceFrames(125, 100);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ passed: false, score: 0 })
    );
  });

  it("white noise is treated as unvoiced — no note name shown, no pass", async () => {
    renderExercise();
    controller.signal = { type: "noise" };
    await startSinging();
    await advanceFrames(30, 100);
    expect(screen.getByText(/listening for your voice/i)).toBeInTheDocument();
    await advanceFrames(95, 100);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ passed: false })
    );
  });

  it("signal that stops mid-hold (mic unplugged / tab steals mic): no crash, resolves at timeout", async () => {
    renderExercise();
    controller.signal = { type: "sine", freq: 440 };
    await startSinging();
    await advanceFrames(8, 60); // ~0.5s in tune — not enough to pass
    controller.signal = { type: "silence" };
    controller.streams[0].getTracks()[0].readyState = "ended";
    await advanceFrames(125, 100);
    // Documents current behavior: generic timeout failure, no dedicated
    // "mic disconnected" message (flagged in TEST_REPORT.md).
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0].passed).toBe(false);
  });

  it("brief dropout (< 400ms grace) does not reset an in-progress hold", async () => {
    renderExercise();
    controller.signal = { type: "sine", freq: 440 };
    await startSinging();
    await advanceFrames(10, 60); // 600ms held
    controller.signal = { type: "silence" };
    await advanceFrames(3, 100); // 300ms dropout — inside grace
    controller.signal = { type: "sine", freq: 440 };
    await advanceFrames(10, 60); // 600ms more → total ≥ 1s
    expect(onComplete).toHaveBeenCalledWith({ score: 100, passed: true });
  });
});

describe("PitchMatchExercise — permission failures", () => {
  it("mic denied → clear user-facing error, no blank screen", async () => {
    renderExercise({ getUserMediaError: new DOMException("Permission denied", "NotAllowedError") });
    await startSinging();
    expect(screen.getByText(/microphone access is blocked/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("no input device → same clear error path, no crash", async () => {
    renderExercise({ getUserMediaError: new DOMException("No device", "NotFoundError") });
    await startSinging();
    expect(screen.getByText(/microphone access is blocked/i)).toBeInTheDocument();
  });

  it("prompt ignored (getUserMedia never settles) → button shows waiting state, not a hang", async () => {
    renderExercise({ getUserMediaHangs: true });
    await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: /start singing/i }));
    expect(screen.getByRole("button", { name: /waiting for microphone/i })).toBeDisabled();
  });
});

describe("PitchMatchExercise — resource cleanup", () => {
  it("unmounting mid-listen stops tracks and closes the AudioContext (no leaked mic light)", async () => {
    const { unmount } = renderExercise();
    controller.signal = { type: "sine", freq: 440 };
    await startSinging();
    await advanceFrames(3, 60);
    unmount();
    expect(controller.streams[0].getTracks()[0].stop).toHaveBeenCalled();
    expect(controller.contexts[0].close).toHaveBeenCalled();
  });

  it("skip (submitted=true) before mic resolves stops the stream when it arrives", async () => {
    controller = installAudioMocks();
    installFrameClock();
    onComplete = vi.fn();
    const { rerender } = render(
      <PitchMatchExercise
        config={A4_CONFIG}
        difficulty="beginner"
        submitted={false}
        onAnswerChange={vi.fn()}
        onComplete={(r: ExerciseResult) => onComplete(r)}
      />
    );
    // Delay getUserMedia resolution until after skip.
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));
    const gum = navigator.mediaDevices.getUserMedia as unknown as Mock<
      (...args: unknown[]) => Promise<unknown>
    >;
    const original = gum.getMockImplementation()!;
    gum.mockImplementationOnce(async (...args: unknown[]) => {
      await gate;
      return original(...args);
    });

    await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: /start singing/i }));
    // User hits Skip while the permission prompt is open.
    rerender(
      <PitchMatchExercise
        config={A4_CONFIG}
        difficulty="beginner"
        submitted={true}
        onAnswerChange={vi.fn()}
        onComplete={(r: ExerciseResult) => onComplete(r)}
      />
    );
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ passed: false, score: 0 })
    );
    release();
    await act(async () => {});
    // The late-arriving stream must be stopped immediately, not left recording.
    expect(controller.streams[0].getTracks()[0].stop).toHaveBeenCalled();
  });
});
