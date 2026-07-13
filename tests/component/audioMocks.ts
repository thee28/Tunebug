import { vi } from "vitest";

// Fake Web Audio + getUserMedia layer for component tests.
// The signal controller lets a test switch what the "mic" hears mid-test:
// a sine at any frequency, silence, or noise.

export type SignalKind =
  | { type: "sine"; freq: number; amp?: number }
  | { type: "silence" }
  | { type: "noise" };

export interface AudioTestController {
  signal: SignalKind;
  sampleRate: number;
  /** All fake AudioContexts constructed so far. */
  contexts: FakeAudioContext[];
  /** All fake MediaStreams handed out by getUserMedia. */
  streams: FakeMediaStream[];
}

export class FakeMediaStreamTrack {
  kind = "audio";
  readyState: "live" | "ended" = "live";
  stop = vi.fn(() => {
    this.readyState = "ended";
  });
}

export class FakeMediaStream {
  private tracks = [new FakeMediaStreamTrack()];
  getTracks() {
    return this.tracks;
  }
}

export class FakeAnalyserNode {
  fftSize = 2048;
  private sampleIndex = 0;
  private noiseSeed = 987654321;

  constructor(private controller: AudioTestController) {}

  getFloatTimeDomainData(buf: Float32Array) {
    const { signal, sampleRate } = this.controller;
    for (let i = 0; i < buf.length; i++) {
      const t = (this.sampleIndex + i) / sampleRate;
      switch (signal.type) {
        case "sine":
          buf[i] = (signal.amp ?? 0.5) * Math.sin(2 * Math.PI * signal.freq * t);
          break;
        case "noise":
          this.noiseSeed = (this.noiseSeed * 1103515245 + 12345) & 0x7fffffff;
          buf[i] = (this.noiseSeed / 0x7fffffff) * 2 - 1;
          break;
        default:
          buf[i] = 0;
      }
    }
    // Advance phase so consecutive reads look like a continuous signal.
    this.sampleIndex += buf.length;
  }
}

export class FakeAudioContext {
  state: "running" | "closed" | "suspended" = "running";
  sampleRate: number;
  closed = false;

  constructor(private controller: AudioTestController) {
    this.sampleRate = controller.sampleRate;
    controller.contexts.push(this);
  }

  createAnalyser() {
    return new FakeAnalyserNode(this.controller);
  }

  createMediaStreamSource() {
    return { connect: vi.fn() };
  }

  close = vi.fn(async () => {
    this.state = "closed";
    this.closed = true;
  });
}

export interface InstallOptions {
  /** Reject getUserMedia with this error instead of resolving. */
  getUserMediaError?: Error;
  /** Never settle the getUserMedia promise (user ignores the prompt). */
  getUserMediaHangs?: boolean;
}

/** Install fakes onto globalThis/navigator. Returns the signal controller. */
export function installAudioMocks(options: InstallOptions = {}): AudioTestController {
  const controller: AudioTestController = {
    signal: { type: "silence" },
    sampleRate: 48000,
    contexts: [],
    streams: [],
  };

  vi.stubGlobal(
    "AudioContext",
    class {
      constructor() {
        return new FakeAudioContext(controller);
      }
    }
  );

  const getUserMedia = vi.fn(async () => {
    if (options.getUserMediaHangs) {
      return new Promise<never>(() => {});
    }
    if (options.getUserMediaError) {
      throw options.getUserMediaError;
    }
    const stream = new FakeMediaStream();
    controller.streams.push(stream);
    return stream;
  });

  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });

  return controller;
}
