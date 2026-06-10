"use client";

import { useState } from "react";
import Link from "next/link";

const C = {
  dark: "#0F0F13", surface: "#1C1B21", surfaceHigh: "#211F26",
  border: "#33313D", muted: "#938F99", text: "#f3eff5",
  primary: "#574eb1", primaryDim: "#c5c0ff", accent: "#c5c0ff",
};

const FAQ_GROUPS = [
  {
    title: "Using Tunebug",
    items: [
      {
        q: "What is Tunebug?",
        a: "Tunebug is a gamified ear training app that teaches you to identify notes, intervals, and melodies by ear. Complete lessons, earn XP, and climb the leagues.",
      },
      {
        q: "What is a streak?",
        a: "A streak tracks how many consecutive days you've practiced. Complete at least one lesson each day to keep your streak alive. Streaks reset at midnight if you miss a day.",
      },
      {
        q: "What are leaderboards and leagues?",
        a: "Each week you compete with other learners in your league based on XP earned. Top performers are promoted to a higher league (Bronze → Silver → Gold → Diamond). Bottom performers may be demoted.",
      },
      {
        q: "What are quests?",
        a: "Quests are daily challenges that reward bonus XP. Complete tasks like earning 10 XP or finishing 2 lessons to unlock them before the day resets at midnight.",
      },
    ],
  },
  {
    title: "Account Management",
    items: [
      {
        q: "How do I change my name or password?",
        a: "Go to Settings → Profile. You can update your display name and change your password by entering your current password and a new one, then clicking Save Changes.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings → Profile and scroll to the bottom. Click 'Delete my account'. This action is permanent and cannot be undone — all your progress and XP will be lost.",
      },
      {
        q: "How do I export my data?",
        a: "Go to Settings → Profile and click 'Export my data'. You'll receive a downloadable file containing your account information and lesson history.",
      },
    ],
  },
  {
    title: "Learning",
    items: [
      {
        q: "How does the lesson system work?",
        a: "Lessons are organized into stages and units. Each lesson introduces one or two notes or intervals through a sequence of teach slides and exercises. Pass with 70% or higher to earn XP and unlock the next lesson.",
      },
      {
        q: "What exercise types are there?",
        a: "Tunebug includes ear training (identify a note by ear), pitch matching (sing a note), sight reading (name a note on the staff), and interval identification exercises.",
      },
      {
        q: "What is Free Practice?",
        a: "Free Practice lets you build custom sessions. Choose a difficulty level, select exercise types, and pick a session length (Short / Medium / Long). No XP is awarded, but it's great for focused drilling.",
      },
      {
        q: "How is XP calculated?",
        a: "You earn XP for passing lessons. Most lessons reward 10 XP; review and consolidation lessons reward 15 XP. Your total XP determines your level and league tier.",
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 600 }}>
          {q}
        </span>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 22, color: C.muted, flexShrink: 0, marginLeft: 16,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <p style={{
          color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, lineHeight: 1.7,
          padding: "0 24px 18px", margin: 0,
        }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.dark, color: C.text }}>

      {/* Header */}
      <header style={{
        borderBottom: `2px solid ${C.border}`,
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center",
      }}>
        <Link
          href="/"
          style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 900, textDecoration: "none" }}
        >
          Tunebug
        </Link>
      </header>

      {/* Breadcrumb */}
      <div style={{ padding: "20px 32px 0", display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/dashboard?view=settings" style={{ color: C.accent, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}>
          Help Center
        </Link>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.muted }}>chevron_right</span>
        <span style={{ color: C.accent, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Home
        </span>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>
        <h1 style={{
          color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 900,
          textAlign: "center", margin: "0 0 40px",
        }}>
          Frequently Asked Questions
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {FAQ_GROUPS.map(group => (
            <div
              key={group.title}
              style={{ borderRadius: 16, border: `2px solid ${C.border}`, overflow: "hidden" }}
            >
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.accent, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800 }}>
                  {group.title}
                </span>
              </div>
              {group.items.map(item => (
                <AccordionItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
