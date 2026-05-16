"use client";

import Link from "next/link";
import { motion, useInView, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  dark:         "#0F0F13",
  primary:      "#574eb1",
  primaryDim:   "#c5c0ff",
  primaryDark:  "#41379b",
  secondary:    "#006c4e",
  secondaryDark:"#004d35",
  secondaryDim: "#68dbae",
  tertiaryDim:  "#ffb95d",
  coral:        "#D85A30",
  surface:      "rgba(255,255,255,0.05)",
  border:       "rgba(255,255,255,0.1)",
  muted:        "#474552",
  mutedBorder:  "rgba(71,69,82,0.2)",
};

const ease = [0.22, 1, 0.36, 1] as const;

const slideUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease, delay } },
});

const stagger = (delayChildren = 0.05) => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren } },
});

const glassStyle = {
  background: C.surface,
  backdropFilter: "blur(10px)",
  border: `1px solid ${C.border}`,
};

function ScrollReveal({
  children, className, delay = 0, from = "bottom",
}: {
  children: React.ReactNode; className?: string; delay?: number;
  from?: "bottom" | "left" | "right";
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const initial =
    from === "left"  ? { opacity: 0, x: -48 } :
    from === "right" ? { opacity: 0, x:  48 } :
                       { opacity: 0, y:  48 };
  const visible =
    from === "left"  ? { opacity: 1, x: 0 } :
    from === "right" ? { opacity: 1, x: 0 } :
                       { opacity: 1, y: 0 };
  return (
    <motion.div ref={ref} initial={initial}
      animate={inView ? visible : initial}
      transition={{ duration: 0.7, ease, delay }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ showCTA }: { showCTA: boolean }) {
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease }}
      className="sticky top-0 z-50 border-b-2"
      style={{ backgroundColor: C.dark, borderColor: C.mutedBorder }}
    >
      <div className="flex justify-between items-center h-16 px-5 md:px-10 w-full max-w-[1200px] mx-auto">
        <span className="text-2xl font-bold tracking-tight"
          style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif" }}>
          Tunebug
        </span>
        <AnimatePresence mode="wait">
          {showCTA ? (
            <motion.div key="cta"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.25, ease }}>
              <Link href="/login?tab=signup">
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ y: 2 }}
                  className="block px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer text-white"
                  style={{ backgroundColor: C.primary, borderBottom: `3px solid ${C.primaryDark}` }}>
                  Start Now
                </motion.span>
              </Link>
            </motion.div>
          ) : (
            <motion.div key="login"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.25, ease }}>
              <Link href="/login">
                <motion.span
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  whileTap={{ scale: 0.96 }}
                  className="block px-6 py-2 rounded-xl text-xs font-semibold uppercase tracking-widest cursor-pointer"
                  style={{ color: C.primaryDim }}>
                  Login
                </motion.span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

// ─── Hero + Instrument bar (one viewport-height unit) ─────────────────────────
const instruments = [
  { icon: "mic",        label: "Vocals",        color: C.tertiaryDim },
  { icon: "music_note", label: "Theory",        color: C.coral },
  { icon: "graphic_eq", label: "Ear Training",  color: C.secondaryDim },
  { icon: "lyrics",     label: "Sight Singing", color: C.primaryDim },
];

function HeroSection({ heroCtaRef }: { heroCtaRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* Hero */}
      <div className="flex-1 flex items-center max-w-[1200px] mx-auto px-5 md:px-10 py-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          {/* Illustration */}
          <motion.div className="order-2 md:order-1 flex justify-center"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease, delay: 0.15 }}>
            <div className="relative w-full max-w-[440px] aspect-square">
              <img alt="Tunebug character" className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida/ADBb0ug-j11tBG7V5JYEsCIH_jFXnCf4KexYEcu5kYsaZQyCkA9jzYSPTW4A1ybekERoAjtDyuE1ixeCQG1VtOycOEuuTCVzBARSWyRW9HHUehB-3k6d40GaphTlABZgCusgO_1E8PuMMVP0Zwqg6JPdDZVfca6EWGY4A8I_ea7Fnb96cR6Dbc5jTXEt74CVlGFdtXsWcgWEjGEfRAgwdQA9-NbQML4wQpL42f4RK9IL-K1As6LA98edzzDXzP4fYzlpoJJ7_Q4CG3soJGo" />
            </div>
          </motion.div>

          {/* Copy + CTAs */}
          <motion.div className="order-1 md:order-2 space-y-8 text-center md:text-left"
            initial="hidden" animate="visible" variants={stagger(0.1)}>
            <motion.h1
              variants={slideUp(0)}
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight"
              style={{ fontFamily: "'Nunito', sans-serif", letterSpacing: "-0.01em" }}>
              The free, fun, and effective way to learn music!
            </motion.h1>

            <motion.div variants={stagger(0.15)}
              className="flex flex-col gap-4 max-w-sm mx-auto md:mx-0" ref={heroCtaRef}>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}>
                <Link href="/login?tab=signup" className="block">
                  <motion.span whileHover={{ scale: 1.02 }} whileTap={{ y: 2 }}
                    className="block w-full py-4 px-8 rounded-2xl text-center text-xs font-bold uppercase tracking-widest text-white cursor-pointer"
                    style={{ backgroundColor: C.primary, borderBottom: `4px solid ${C.primaryDark}` }}>
                    Get Started
                  </motion.span>
                </Link>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}>
                <Link href="/login" className="block">
                  <motion.span
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    whileTap={{ y: 2 }}
                    className="block w-full py-4 px-8 rounded-2xl text-center text-xs font-semibold uppercase tracking-widest cursor-pointer transition-colors"
                    style={{ color: C.muted, border: `2px solid ${C.muted}`, borderBottom: `4px solid ${C.muted}` }}>
                    I already have an account
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Instrument bar pinned to bottom of first viewport */}
      <InstrumentBar />
    </div>
  );
}

function InstrumentBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <section className="border-y-2 py-6 overflow-hidden shrink-0"
      style={{ borderColor: "rgba(71,69,82,0.1)", background: "rgba(15,15,19,0.6)" }}>
      <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"}
        variants={stagger(0.05)}
        className="max-w-[1200px] mx-auto px-5 md:px-10 flex justify-center items-center gap-12 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}>
        {instruments.map(({ icon, label, color }) => (
          <motion.div key={label}
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
            className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined" style={{ color, fontSize: 22 }}>{icon}</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>{label}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ─── Feature glass card (Feature 1) ───────────────────────────────────────────
const glassIcons = [
  { icon: "mic",        color: C.secondaryDim, accent: "rgba(0,108,78,0.4)" },
  { icon: "music_note", color: C.primaryDim,   accent: "rgba(87,78,177,0.4)" },
  { icon: "podcasts",   color: C.tertiaryDim,  accent: "rgba(130,81,0,0.4)" },
  { icon: "graphic_eq", color: C.coral,        accent: "rgba(216,90,48,0.4)" },
];

function FeatureGlassCard() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="w-full max-w-[400px] rounded-[40px] p-8 relative overflow-hidden" style={glassStyle}>
      <div className="h-4 rounded-full w-full mb-8 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <motion.div initial={{ width: 0 }} animate={inView ? { width: "67%" } : { width: 0 }}
          transition={{ duration: 1.2, ease, delay: 0.4 }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: C.secondaryDim, boxShadow: "0 0 16px rgba(104,219,174,0.5)" }} />
      </div>
      <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger(0.25)} className="grid grid-cols-2 gap-4">
        {glassIcons.map(({ icon, color, accent }) => (
          <motion.div key={icon}
            variants={{ hidden: { opacity: 0, scale: 0.75 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } } }}
            whileHover={{ scale: 1.06 }}
            className="aspect-square rounded-2xl flex items-center justify-center"
            style={{ ...glassStyle, borderBottom: `4px solid ${accent}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Feature 1: Master your voice ────────────────────────────────────────────
function FeatureVoice() {
  return (
    <section className="max-w-[1200px] mx-auto px-5 md:px-10 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <ScrollReveal from="left">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ color: C.secondaryDim, fontFamily: "'Nunito', sans-serif" }}>
            Master your voice.<br />Any time. Anywhere.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: C.muted }}>
            Unlock your singing potential with Tunebug. Our interactive platform provides{" "}
            <span className="font-bold" style={{ color: C.secondaryDim }}>real-time pitch detection</span>{" "}
            and instant feedback, helping you refine your technique through bite-sized vocal drills designed to fit into your daily routine.
          </p>
        </div>
      </ScrollReveal>
      <ScrollReveal from="right" delay={0.1} className="flex justify-center">
        <FeatureGlassCard />
      </ScrollReveal>
    </section>
  );
}

// ─── Feature 2: Tuned for Precision ──────────────────────────────────────────
function FeaturePrecision() {
  return (
    <section className="max-w-[1200px] mx-auto px-5 md:px-10 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <ScrollReveal from="left" delay={0.1} className="order-2 md:order-1 flex justify-center">
        <div className="relative w-full max-w-[440px] aspect-square">
          <img alt="Science of music" className="w-full h-full object-contain rounded-3xl"
            src="https://lh3.googleusercontent.com/aida/ADBb0ugqlG_gXn3z6cgSQFbc1MYP6Qvv64ZSoONZ9XtVELBdEAZmsdxIz7pdfScP849r6sgAViGuSJwYHmK7aZLMZB3zd6SOzsR38tt4wi9YilpnXAzoIm-s4-Dd6kpD4CTnrROP8AMZVlHY6jVjPRy3TMN63xigbuLKqs5giFAYZICq3vVSufffgMd5PRjr55t1sjYtOra_v3bx2lHBGxTUiKtxKyRqFrzA4wMUt5ogX2AGh98velE6ibvXy4ij6hLRWKmxCuefH-RLhc4" />
        </div>
      </ScrollReveal>
      <ScrollReveal from="right" className="order-1 md:order-2">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold"
            style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif" }}>
            Tuned for Precision
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: C.muted }}>
            Experience a smarter way to train. Tunebug leverages proprietary pitch-tracking technology and a vocal pedagogy framework designed by industry experts to ensure every note you sing is tracked with scientific accuracy, leading to faster results.
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}

// ─── Feature 3: Build Your Streak ────────────────────────────────────────────
function StreakCard() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="w-full max-w-[400px] rounded-[40px] p-8 space-y-6" style={glassStyle}>
      {/* Streak badge */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
        className="flex items-center gap-3 rounded-2xl px-5 py-4"
        style={{ background: "rgba(255,185,93,0.12)", border: "1px solid rgba(255,185,93,0.25)" }}>
        <span style={{ fontSize: 36 }}>🔥</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.tertiaryDim }}>Current Streak</p>
          <p className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>7 Days</p>
        </div>
      </motion.div>

      {/* Stage progress */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, ease, delay: 0.35 }}
        className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>Stage 2: Intervals</span>
          <span className="text-xs font-bold" style={{ color: C.primaryDim }}>4 / 6</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <motion.div initial={{ width: 0 }} animate={inView ? { width: "67%" } : { width: 0 }}
            transition={{ duration: 1, ease, delay: 0.5 }}
            className="h-full rounded-full"
            style={{ background: C.primaryDim, boxShadow: "0 0 12px rgba(197,192,255,0.5)" }} />
        </div>
      </motion.div>

      {/* XP earned today */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, ease, delay: 0.5 }}
        className="flex items-center justify-between rounded-2xl px-5 py-4"
        style={{ background: "rgba(104,219,174,0.1)", border: "1px solid rgba(104,219,174,0.2)" }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.secondaryDim }}>XP Earned Today</span>
        <span className="text-2xl font-extrabold" style={{ color: C.secondaryDim, fontFamily: "'Nunito', sans-serif" }}>+30 ⭐</span>
      </motion.div>
    </div>
  );
}

function FeatureStreak() {
  return (
    <section className="max-w-[1200px] mx-auto px-5 md:px-10 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <ScrollReveal from="left">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ color: C.tertiaryDim, fontFamily: "'Nunito', sans-serif" }}>
            Stay Consistent.<br />Never Miss a Beat.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: C.muted }}>
            Building a skill takes daily practice. Tunebug keeps you coming back with{" "}
            <span className="font-bold" style={{ color: C.tertiaryDim }}>daily streaks, XP rewards, and stage unlocks,</span>{" "}
             so every session feels like progress. Miss a day? No worries. Just pick up where you left off.
          </p>
        </div>
      </ScrollReveal>
      <ScrollReveal from="right" delay={0.1} className="flex justify-center">
        <StreakCard />
      </ScrollReveal>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className="relative pt-16 pb-0" style={{ overflow: "hidden" }}>

      {/* Headline + button — no glow, plain dark bg same as rest of page */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
        transition={{ duration: 0.7, ease }}
        className="relative text-center flex flex-col items-center gap-8 px-5 pb-2">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight"
          style={{ fontFamily: "'Nunito', sans-serif" }}>
          Ready to start<br />your musical journey?
        </h2>
        <Link href="/login?tab=signup" className="inline-block">
          <motion.span
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ y: 3 }}
            className="block py-4 px-14 rounded-2xl font-extrabold text-white text-lg cursor-pointer uppercase tracking-wider"
            style={{
              fontFamily: "'Nunito', sans-serif",
              backgroundColor: C.primary,
              borderBottom: `5px solid ${C.primaryDark}`,
            }}>
            Get Started
          </motion.span>
        </Link>
      </motion.div>

      {/* Stage: emoji placeholder + layered waves */}
      <div className="relative w-full" style={{ height: 280 }}>

        {/* 3-layer wave — back to front, progressively lighter dark indigo */}
        <svg viewBox="0 0 1440 420" preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-full" style={{ pointerEvents: "none" }}>

          {/* Layer 1 — deepest back, highest hills */}
          <path
            d="M0,420 L0,20 C160,-20 380,200 720,230 C1060,260 1280,-20 1440,20 L1440,420 Z"
            fill="#0c0a1e"
          />
          {/* Layer 2 — mid depth */}
          <path
            d="M0,420 L0,70 C190,30 400,215 720,245 C1040,275 1250,30 1440,70 L1440,420 Z"
            fill="#111030"
          />
          {/* Layer 3 — front, lowest hills, lightest */}
          <path
            d="M0,420 L0,130 C220,85 420,235 720,265 C1020,295 1220,85 1440,130 L1440,420 Z"
            fill="#18163f"
          />
        </svg>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const footerLinks  = ["Privacy", "Terms", "Support", "Careers"];
const socialIcons  = ["public", "groups", "play_circle"];

function Footer() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.footer ref={ref} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.7, ease }}
      className="border-t py-16"
      style={{ backgroundColor: C.dark, borderColor: "rgba(200,196,212,0.1)" }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 flex flex-col items-center gap-12">
        <div className="flex flex-wrap justify-center gap-4">
          {footerLinks.map((link) => (
            <a key={link} href="#"
              className="text-xs font-semibold uppercase tracking-widest transition-colors"
              style={{ color: C.muted }}
              onMouseEnter={e => (e.currentTarget.style.color = C.primaryDim)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
              {link}
            </a>
          ))}
        </div>
        <div className="flex flex-col items-center gap-4">
          <span className="text-2xl font-bold tracking-tight"
            style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif" }}>
            Tunebug
          </span>
          <p className="text-sm" style={{ color: "rgba(71,69,82,0.6)" }}>© 2024 Tunebug Music. Play the rhythm.</p>
        </div>
        <div className="flex gap-4">
          {socialIcons.map((icon) => (
            <motion.div key={icon} whileHover={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
              style={{ ...glassStyle, color: C.muted }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const [showNavCTA, setShowNavCTA] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const el = heroCtaRef.current;
    if (!el) return;
    const bottom = el.getBoundingClientRect().bottom;
    setShowNavCTA(bottom < 0);
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.dark, color: "#ffffff" }}>
      <Nav showCTA={showNavCTA} />
      <main>
        <HeroSection heroCtaRef={heroCtaRef} />
        <FeatureVoice />
        <FeaturePrecision />
        <FeatureStreak />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
