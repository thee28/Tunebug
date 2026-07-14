"use client";

import { useEffect, useRef, useState } from "react";
import { getPiano } from "@/lib/audio/piano";
import { PitchDetector } from "pitchy";
import type { PitchMatchConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { DIFFICULTY_SETTINGS } from "@/lib/curriculum/content";
import { noteStringToFrequency, frequencyToNote, foldedCents } from "@/lib/music/notes";

interface Props {
  config: PitchMatchConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  success: "#006c4e", successDim: "#83f5c6", text: "var(--c-text)",
  error: "#ffb4ab", tertiary: "#ffb95d",
};

// Voiced-pitch plausibility window — rejects rumble and whistle-register noise.
const MIN_HZ = 50;
const MAX_HZ = 1500;
// Brief dropouts (breath, consonants) shouldn't reset the hold.
const GRACE_MS = 400;
// Meter display span. Wider than the pass window so the needle has room
// to approach the green zone instead of pinning at the edges.
const METER_RANGE_CENTS = 120;
// Time constant for the exponential smoothing of the cents readout (ms).
// Larger = slower, calmer needle.
const SMOOTHING_MS = 180;
// Median window (frames) — swallows single-frame octave/fifth misdetections
// from the pitch detector that would otherwise fling the needle to an edge.
const MEDIAN_WINDOW = 5;

type Phase = "idle" | "listening" | "passed" | "failed" | "mic-error";
type MicError = "denied" | "no-device" | "disconnected";

const MIC_ERROR_COPY: Record<MicError, string> = {
  denied: "Microphone access is blocked. Allow it in your browser's site settings, then try again.",
  "no-device": "No microphone found. Plug one in or pick an input device, then try again.",
  disconnected: "The microphone disconnected mid-exercise. Reconnect it, then try again.",
};

export function PitchMatchExercise({ config, difficulty, submitted, onComplete }: Props) {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const targetHz = noteStringToFrequency(config.targetNote);
  const holdNeededMs = settings.holdDuration * 1000;
  const timeoutMs = settings.timeoutSeconds * 1000;

  const [phase, setPhase] = useState<Phase>("idle");
  // Transition-only states: these change a handful of times per exercise.
  const [liveNoteName, setLiveNoteName] = useState<string | null>(null);
  const [inTune, setInTune] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.timeoutSeconds);
  const [notePlaying, setNotePlaying] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const [micError, setMicError] = useState<MicError>("denied");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);

  // Per-frame visuals are written straight to the DOM from the RAF loop —
  // routing ~60 updates/s through React state re-rendered the whole exercise
  // on every audio frame.
  const meterRef = useRef<HTMLDivElement | null>(null);
  const needleRef = useRef<HTMLDivElement | null>(null);
  const centsTextRef = useRef<HTMLSpanElement | null>(null);
  const hintTextRef = useRef<HTMLParagraphElement | null>(null);
  const ringRef = useRef<SVGCircleElement | null>(null);

  function stopAudio() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  function finish(result: ExerciseResult, nextPhase: Phase) {
    if (completedRef.current) return;
    completedRef.current = true;
    stopAudio();
    setPhase(nextPhase);
    onComplete(result);
  }

  // Skip pressed in the runner before the exercise resolved — report a fail.
  // finish() no-ops via completedRef when the exercise already resolved.
  useEffect(() => {
    if (!submitted) return;
    finish(
      { score: 0, passed: false, correctAnswerText: `${config.displayNote} (${config.targetNote})` },
      "failed"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  async function playTargetNote() {
    if (notePlaying) return;
    setNotePlaying(true);
    try {
      const piano = await getPiano();
      piano.triggerAttackRelease(config.targetNote, "1");
      setTimeout(() => setNotePlaying(false), 1100);
    } catch {
      setNotePlaying(false);
    }
  }

  async function startListening() {
    if (requestingMic) return;
    setRequestingMic(true);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // Processing designed for speech calls distorts sung pitch.
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setMicError(name === "NotFoundError" || name === "DevicesNotFoundError" ? "no-device" : "denied");
      setPhase("mic-error");
      return;
    } finally {
      setRequestingMic(false);
    }
    // Skip may have fired while the permission prompt was open.
    if (completedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    // Unplugged / OS revoked / another app grabbed the device: tell the user
    // instead of silently timing out with a blank needle.
    stream.getTracks().forEach((track) => {
      track.addEventListener("ended", () => {
        if (completedRef.current) return;
        stopAudio();
        setMicError("disconnected");
        setPhase("mic-error");
      });
    });

    const audioCtx = new AudioContext();
    // Safari can hand out a suspended context even inside a user gesture.
    audioCtx.resume().catch(() => {});
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    audioCtx.createMediaStreamSource(stream).connect(analyser);

    streamRef.current = stream;
    audioCtxRef.current = audioCtx;

    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    const buf = new Float32Array(analyser.fftSize);

    setPhase("listening");
    setTimeLeft(settings.timeoutSeconds);

    const startTime = performance.now();
    let lastFrame = startTime;
    let holdMs = 0;
    let bestHoldMs = 0;
    let offTargetMs = 0;
    let unvoicedMs = 0;
    const centsHistory: number[] = [];
    let smoothedCents: number | null = null;

    // Paint the per-frame visuals without going through React.
    const paintFrame = (cents: number | null) => {
      const needle = needleRef.current;
      if (needle) {
        if (cents === null) {
          needle.style.display = "none";
        } else {
          const clamped = Math.max(-METER_RANGE_CENTS, Math.min(METER_RANGE_CENTS, cents));
          const pct = 50 + (clamped / METER_RANGE_CENTS) * 50;
          const frameInTune = Math.abs(cents) <= settings.allowedDeviation;
          needle.style.display = "block";
          needle.style.left = `${pct}%`;
          needle.style.backgroundColor = frameInTune ? C.successDim : C.tertiary;
        }
      }
      meterRef.current?.setAttribute(
        "aria-valuenow",
        cents === null ? "0" : String(Math.round(cents))
      );
      if (centsTextRef.current && cents !== null) {
        centsTextRef.current.textContent = `${cents > 0 ? "+" : ""}${Math.round(cents)}¢`;
      }
      if (hintTextRef.current && cents !== null) {
        const frameInTune = Math.abs(cents) <= settings.allowedDeviation;
        hintTextRef.current.textContent = frameInTune
          ? "Hold it…"
          : cents > 0
            ? "A little lower"
            : "A little higher";
      }
      if (ringRef.current) {
        const circumference = 2 * Math.PI * 58;
        const progress = Math.min(holdMs / holdNeededMs, 1);
        ringRef.current.style.strokeDashoffset = String(circumference * (1 - progress));
      }
    };

    const tick = () => {
      const now = performance.now();
      const dt = now - lastFrame;
      lastFrame = now;

      analyser.getFloatTimeDomainData(buf);
      const [pitch, clarity] = detector.findPitch(buf, audioCtx.sampleRate);

      const voiced = clarity >= config.confidenceThreshold && pitch >= MIN_HZ && pitch <= MAX_HZ;
      if (voiced) {
        unvoicedMs = 0;
        const rawCents = foldedCents(pitch, targetHz);
        // Median-of-recent kills one-frame octave/fifth detector blips,
        // then exponential smoothing calms the remaining jitter.
        centsHistory.push(rawCents);
        if (centsHistory.length > MEDIAN_WINDOW) centsHistory.shift();
        const median = [...centsHistory].sort((a, b) => a - b)[Math.floor(centsHistory.length / 2)];
        const alpha = Math.min(1, dt / SMOOTHING_MS);
        smoothedCents = smoothedCents === null ? median : smoothedCents + (median - smoothedCents) * alpha;

        // State only on TRANSITIONS (React bails out on identical values).
        setLiveNoteName(frequencyToNote(pitch).name);
        setInTune(Math.abs(smoothedCents) <= settings.allowedDeviation);
        if (Math.abs(smoothedCents) <= settings.allowedDeviation) {
          holdMs += dt;
          offTargetMs = 0;
        } else {
          offTargetMs += dt;
          if (offTargetMs > GRACE_MS) holdMs = 0;
        }
      } else {
        // Keep the needle where it was through brief dropouts (breaths,
        // consonants) instead of blanking and re-slamming it on re-entry.
        unvoicedMs += dt;
        if (unvoicedMs > GRACE_MS) {
          setLiveNoteName(null);
          setInTune(false);
          centsHistory.length = 0;
          smoothedCents = null;
        }
        offTargetMs += dt;
        if (offTargetMs > GRACE_MS) holdMs = 0;
      }

      bestHoldMs = Math.max(bestHoldMs, holdMs);
      paintFrame(smoothedCents);
      setTimeLeft(Math.max(0, Math.ceil((timeoutMs - (now - startTime)) / 1000)));

      if (holdMs >= holdNeededMs) {
        finish({ score: 100, passed: true }, "passed");
        return;
      }
      if (now - startTime >= timeoutMs) {
        // Partial credit for sustained near-misses, always below passing.
        const score = Math.min(65, Math.round(70 * (bestHoldMs / holdNeededMs)));
        finish(
          { score, passed: false, correctAnswerText: `${config.displayNote} (${config.targetNote})` },
          "failed"
        );
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  const zoneHalfPct = (settings.allowedDeviation / METER_RANGE_CENTS) * 50;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: "0 0 8px" }}>
          Sing this note into your microphone
        </p>

        {/* Target note circle with hold-progress ring */}
        <div style={{ position: "relative", width: 128, height: 128, margin: "0 auto" }}>
          <svg width="128" height="128" viewBox="0 0 128 128" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="64" cy="64" r="58" fill="none" stroke="var(--c-border)" strokeWidth="6" />
            <circle
              ref={ringRef}
              cx="64" cy="64" r="58" fill="none"
              stroke={phase === "passed" ? C.successDim : C.primaryDim}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 58}
              // Live progress is painted by the RAF loop (style wins over this
              // attribute); the attribute covers the pre-listening/passed states.
              strokeDashoffset={2 * Math.PI * 58 * (phase === "passed" ? 0 : 1)}
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 8, borderRadius: "50%",
            backgroundColor: C.surfaceHigh,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 46, fontWeight: 900, color: C.text }}>
              {config.displayNote}
            </span>
          </div>
        </div>

        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, marginTop: 10 }}>
          {config.targetNote} · hold for {settings.holdDuration}s · ±{settings.allowedDeviation}¢
        </p>
      </div>

      {phase === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <button
            onClick={playTargetNote}
            className="btn-ghost-hover"
            style={{
              padding: "12px 32px", borderRadius: 12,
              backgroundColor: "transparent", border: `2px solid ${C.border}`,
              color: C.primaryDim,
              fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {notePlaying ? "graphic_eq" : "volume_up"}
            </span>
            Hear the Note
          </button>
          <button
            onClick={startListening}
            disabled={requestingMic}
            style={{
              padding: "16px 48px", borderRadius: 14,
              backgroundColor: requestingMic ? C.surfaceHigh : C.primary,
              boxShadow: requestingMic ? "none" : `0 4px 0 0 ${C.primaryDark}`,
              color: requestingMic ? C.muted : "white", border: "none",
              fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700,
              cursor: requestingMic ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>mic</span>
            {requestingMic ? "Waiting for microphone…" : "Start Singing"}
          </button>
        </div>
      )}

      {phase === "listening" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 340 }}>
          {/* Tuner meter — needle position/color painted by the RAF loop */}
          <div style={{ width: "100%" }}>
            <div
              ref={meterRef}
              role="meter"
              aria-label="Pitch deviation from the target note, in cents"
              aria-valuemin={0 - METER_RANGE_CENTS}
              aria-valuemax={METER_RANGE_CENTS}
              aria-valuenow={0}
              style={{ position: "relative", height: 14, borderRadius: 7, backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}` }}
            >
              {/* In-tune zone, scaled to the meter's ±METER_RANGE_CENTS span */}
              <div style={{
                position: "absolute", top: 0, bottom: 0,
                left: `${50 - zoneHalfPct}%`,
                width: `${zoneHalfPct * 2}%`,
                backgroundColor: "rgba(0,108,78,0.35)", borderRadius: 5,
              }} />
              {/* Needle */}
              <div
                ref={needleRef}
                style={{
                  position: "absolute", top: -6, bottom: -6,
                  left: "50%", width: 4, marginLeft: -2, borderRadius: 2,
                  backgroundColor: C.tertiary,
                  transition: "left 0.2s ease-out",
                  display: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 11 }}>♭ flat</span>
              <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 11 }}>♯ sharp</span>
            </div>
          </div>

          {/* Live readout */}
          <div style={{ textAlign: "center", minHeight: 44 }}>
            {liveNoteName ? (
              <>
                <p style={{
                  color: inTune ? C.successDim : C.text,
                  fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900, margin: 0,
                }}>
                  {liveNoteName}
                  {/* Cents readout painted per-frame by the RAF loop */}
                  <span ref={centsTextRef} style={{ fontSize: 14, fontWeight: 700, color: C.muted, marginLeft: 8 }} />
                </p>
                <p ref={hintTextRef} style={{ color: inTune ? C.successDim : C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: "2px 0 0", fontWeight: 700 }}>
                  {inTune ? "Hold it…" : "A little higher"}
                </p>
              </>
            ) : (
              <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>
                Listening for your voice…
              </p>
            )}
          </div>

          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, margin: 0 }}>
            {timeLeft}s left
          </p>
        </div>
      )}

      {phase === "passed" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: "#4ade80", fontSize: 28 }}>check_circle</span>
          <span style={{ color: "#4ade80", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>Nailed it!</span>
        </div>
      )}

      {phase === "failed" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: C.error, fontSize: 26 }}>timer_off</span>
            <span style={{ color: C.error, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
              Time&apos;s up
            </span>
          </div>
          <button
            onClick={playTargetNote}
            className="btn-ghost-hover"
            style={{
              padding: "10px 24px", borderRadius: 12,
              backgroundColor: "transparent", border: `2px solid ${C.border}`,
              color: C.primaryDim,
              fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>volume_up</span>
            Hear the Note
          </button>
        </div>
      )}

      {phase === "mic-error" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center", maxWidth: 320 }}>
          <span className="material-symbols-outlined" style={{ color: C.error, fontSize: 34 }}>mic_off</span>
          <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            {MIC_ERROR_COPY[micError]}
          </p>
          <button
            onClick={startListening}
            style={{
              padding: "12px 32px", borderRadius: 12,
              backgroundColor: C.primary, boxShadow: `0 4px 0 0 ${C.primaryDark}`,
              color: "white", border: "none",
              fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
