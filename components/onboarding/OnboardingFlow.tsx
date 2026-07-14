"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SKILL_LEVELS,
  TIME_COMMITMENTS,
  getSkillLevel,
  type StartMethod,
} from "@/lib/onboarding";

const C = {
  primary: "#574eb1",
  primaryDark: "#41379b",
  primaryDim: "#c5c0ff",
  secondary: "#006c4e",
  secondaryDim: "#83f5c6",
  tertiary: "#ffb95d",
  dark: "var(--c-dark)",
  surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)",
  muted: "var(--c-muted)",
  text: "var(--c-text)",
};

const nunito = "'Nunito', sans-serif";

// step: 0 = skill, 1 = time, 2 = start method, 3 = placement recommendation
type Step = 0 | 1 | 2 | 3;

interface Props {
  firstName: string;
  sectionTitles: string[];
}

export default function OnboardingFlow({ firstName, sectionTitles }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [skillId, setSkillId] = useState<string | null>(null);
  const [timeId, setTimeId] = useState<string | null>(null);
  const [startMethod, setStartMethod] = useState<StartMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const skill = skillId ? getSkillLevel(skillId) : undefined;
  const targetIndex = skill?.targetSectionIndex ?? 0;
  const targetTitle = sectionTitles[targetIndex] ?? "Section 1";

  const CORE_STEPS = 3; // skill, time, start method
  const progressPct = step >= CORE_STEPS ? 100 : ((step + 1) / CORE_STEPS) * 100;

  async function submit(method: StartMethod) {
    if (submitting || !skillId || !timeId) return;
    setSubmitting(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillLevel: skillId,
          timeCommitment: timeId,
          startMethod: method,
          // Streak day boundaries are computed in the user's own timezone.
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
    } finally {
      // Even on failure we move on — the dashboard guard re-routes if needed.
      router.push("/dashboard");
      router.refresh();
    }
  }

  function goBack() {
    if (step === 0) {
      router.push("/dashboard");
      return;
    }
    setStep((s) => (s - 1) as Step);
  }

  function handleContinue() {
    if (step === 0 && skillId) {
      setStep(1);
    } else if (step === 1 && timeId) {
      setStep(2);
    } else if (step === 2 && startMethod) {
      if (startMethod === "find-level" && targetIndex > 0) {
        setStep(3);
      } else {
        submit(startMethod);
      }
    } else if (step === 3) {
      submit("find-level");
    }
  }

  const canContinue =
    (step === 0 && !!skillId) ||
    (step === 1 && !!timeId) ||
    (step === 2 && !!startMethod) ||
    step === 3;

  const bubbleText =
    step === 0
      ? `Hi ${firstName}! How much music do you know?`
      : step === 1
        ? "How much time do you want to practice each day?"
        : step === 2
          ? "Great! Now let's find the best place to start."
          : `Since you already know some music, you should start with Section ${targetIndex + 1}: ${targetTitle}!`;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: C.dark }}>
      {/* Top bar: back + progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", maxWidth: 720, width: "100%", margin: "0 auto" }}>
        <button
          onClick={goBack}
          aria-label="Back"
          className="btn-ghost-hover"
          style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 26 }}>arrow_back</span>
        </button>
        <div style={{ flex: 1, height: 16, borderRadius: 8, backgroundColor: C.surfaceHigh, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 8, backgroundColor: C.secondary,
            width: `${progressPct}%`, transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, width: "100%", maxWidth: 620, margin: "0 auto", padding: "24px 24px 140px" }}>
        {/* Mascot + speech bubble */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 40 }}>
          <MascotHead step={step} />
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "relative", flex: 1,
                backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
                borderRadius: 16, padding: "16px 20px",
              }}
            >
              <p style={{ color: C.text, fontFamily: nunito, fontSize: 17, fontWeight: 800, margin: 0, lineHeight: 1.35 }}>
                {bubbleText}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
          >
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {SKILL_LEVELS.map((opt) => (
                  <OptionRow
                    key={opt.id}
                    selected={skillId === opt.id}
                    onClick={() => setSkillId(opt.id)}
                    left={<SignalBars level={opt.bars} active={skillId === opt.id} />}
                    label={opt.label}
                  />
                ))}
              </div>
            )}

            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {TIME_COMMITMENTS.map((opt) => (
                  <OptionRow
                    key={opt.id}
                    selected={timeId === opt.id}
                    onClick={() => setTimeId(opt.id)}
                    label={`${opt.minutes} min / day`}
                    right={opt.label}
                  />
                ))}
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <StartCard
                  selected={startMethod === "scratch"}
                  onClick={() => setStartMethod("scratch")}
                  icon="menu_book"
                  iconColor={C.tertiary}
                  iconBg="rgba(255,185,93,0.18)"
                  title="Start from scratch"
                  subtitle="Take the very first lesson of the course"
                />
                <StartCard
                  selected={startMethod === "find-level"}
                  onClick={() => setStartMethod("find-level")}
                  icon="explore"
                  iconColor={C.primaryDim}
                  iconBg="rgba(87,78,177,0.2)"
                  title="Find my level"
                  subtitle="Jump ahead based on what you already know"
                />
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 12 }}>
                <div style={{
                  width: 96, height: 96, borderRadius: "50%",
                  backgroundColor: C.secondary, boxShadow: `0 6px 0 0 #00513a`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 52, color: "white", fontVariationSettings: "'FILL' 1" }}>
                    rocket_launch
                  </span>
                </div>
                <p style={{ color: C.muted, fontFamily: nunito, fontSize: 15, textAlign: "center", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
                  We&apos;ll unlock everything up to <strong style={{ color: C.text }}>Section {targetIndex + 1}: {targetTitle}</strong> so you can pick up right where you belong.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: C.dark, borderTop: `2px solid ${C.border}`,
        padding: "20px 24px",
      }}>
        <div style={{ maxWidth: 620, margin: "0 auto", display: "flex", justifyContent: "flex-end" }}>
          <motion.button
            onClick={handleContinue}
            disabled={!canContinue || submitting}
            whileTap={canContinue && !submitting ? { scale: 0.97 } : {}}
            style={{
              padding: "16px 56px", borderRadius: 14,
              backgroundColor: canContinue ? C.primary : C.surfaceHigh,
              boxShadow: canContinue ? `0 4px 0 0 ${C.primaryDark}` : "none",
              color: canContinue ? "white" : C.muted,
              border: canContinue ? "none" : `2px solid ${C.border}`,
              fontFamily: nunito, fontSize: 16, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.06em",
              cursor: canContinue && !submitting ? "pointer" : "not-allowed",
              transition: "background-color 0.15s, box-shadow 0.15s",
            }}
          >
            {submitting ? "…" : step === 3 ? "Let's go" : "Continue"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

// Tunebug head "speaker". Swaps between eyes-open and eyes-closed on each
// survey step so it looks like a different reaction per question. Both frames
// are the same 735² asset with transparent padding, so we scale + crop the
// head (antennae included) into the small box.
function MascotHead({ step }: { step: number }) {
  const eyesOpen = step % 2 === 0;

  const frame: React.CSSProperties = {
    position: "absolute",
    width: 140,
    maxWidth: "none",
    height: "auto",
    left: -30,
    top: -28,
    transition: "opacity 0.2s ease",
    pointerEvents: "none",
    userSelect: "none",
  };

  return (
    <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/tunebug-talk-open.png" alt="Tunebug" style={{ ...frame, opacity: eyesOpen ? 1 : 0 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/tunebug-talk-closed.png" alt="" aria-hidden style={{ ...frame, opacity: eyesOpen ? 0 : 1 }} />
    </div>
  );
}

function OptionRow({
  selected,
  onClick,
  label,
  left,
  right,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  left?: React.ReactNode;
  right?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%",
        padding: "18px 22px", borderRadius: 16, cursor: "pointer",
        textAlign: "left",
        backgroundColor: selected ? "rgba(87,78,177,0.14)" : C.surfaceHigh,
        border: `2px solid ${selected ? C.primary : C.border}`,
        boxShadow: selected ? `0 3px 0 0 ${C.primaryDark}` : "none",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
    >
      {left}
      <span style={{
        flex: 1, color: selected ? C.primaryDim : C.text,
        fontFamily: nunito, fontSize: 16, fontWeight: 800,
      }}>
        {label}
      </span>
      {right && (
        <span style={{ color: selected ? C.primaryDim : C.muted, fontFamily: nunito, fontSize: 14, fontWeight: 800 }}>
          {right}
        </span>
      )}
    </motion.button>
  );
}

function SignalBars({ level, active }: { level: number; active: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 22, flexShrink: 0 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            width: 4, borderRadius: 2,
            height: 6 + i * 4,
            backgroundColor: i < level ? (active ? C.primaryDim : C.primary) : C.border,
          }}
        />
      ))}
    </span>
  );
}

function StartCard({
  selected,
  onClick,
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      style={{
        display: "flex", alignItems: "center", gap: 18, width: "100%",
        padding: "22px 24px", borderRadius: 18, cursor: "pointer", textAlign: "left",
        backgroundColor: selected ? "rgba(87,78,177,0.14)" : C.surfaceHigh,
        border: `2px solid ${selected ? C.primary : C.border}`,
        boxShadow: selected ? `0 3px 0 0 ${C.primaryDark}` : "none",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 16, flexShrink: 0,
        backgroundColor: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 30, color: iconColor, fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: C.text, fontFamily: nunito, fontSize: 17, fontWeight: 900, margin: "0 0 4px" }}>{title}</p>
        <p style={{ color: C.muted, fontFamily: nunito, fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{subtitle}</p>
      </div>
    </motion.button>
  );
}
