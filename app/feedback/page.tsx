"use client";

import { useState } from "react";
import Link from "next/link";

const C = {
  dark: "var(--c-dark)", surface: "var(--c-surface)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  primary: "#574eb1", primaryDim: "#c5c0ff", accent: "#c5c0ff",
};

const SUPPORT_EMAIL = "tunebugsupport@gmail.com";

const TYPES = [
  { value: "feedback", label: "Feedback" },
  { value: "bug", label: "Bug report" },
];

export default function FeedbackPage() {
  const [type, setType] = useState("feedback");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const canSend = message.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    const typeLabel = TYPES.find(t => t.value === type)?.label ?? "Feedback";
    const subject = `Tunebug ${typeLabel}`;
    const bodyLines = [
      message.trim(),
      "",
      "---",
      email.trim() ? `Reply-to: ${email.trim()}` : "",
    ].filter(Boolean);
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = href;
    setSent(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: C.surface, border: `2px solid ${C.border}`,
    borderRadius: 12, padding: "12px 14px", color: C.text,
    fontFamily: "'Nunito', sans-serif", fontSize: 15, outline: "none",
  };

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
          Settings
        </Link>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.muted }}>chevron_right</span>
        <span style={{ color: C.accent, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Feedback
        </span>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 80px" }}>
        <h1 style={{
          color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 900,
          textAlign: "center", margin: "0 0 8px",
        }}>
          Send us feedback
        </h1>
        <p style={{
          color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, lineHeight: 1.6,
          textAlign: "center", margin: "0 0 32px",
        }}>
          Found a bug or have an idea? Let us know and we&apos;ll get back to you at{" "}
          <span style={{ color: C.accent, fontWeight: 700 }}>{SUPPORT_EMAIL}</span>.
        </p>

        {sent ? (
          <div style={{
            borderRadius: 16, border: `2px solid ${C.border}`, padding: 32,
            textAlign: "center",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.accent, fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800, margin: "12px 0 8px" }}>
              Thanks!
            </h2>
            <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              Your email app should have opened with your message ready to send. If it didn&apos;t,
              email us directly at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.accent, fontWeight: 700 }}>{SUPPORT_EMAIL}</a>.
            </p>
            <button
              onClick={() => { setSent(false); setMessage(""); }}
              style={{
                background: "none", border: `2px solid ${C.border}`, borderRadius: 12,
                padding: "10px 20px", color: C.text, fontFamily: "'Nunito', sans-serif",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Type */}
            <div>
              <label style={{ display: "block", color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                Type
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {TYPES.map(t => {
                  const active = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      style={{
                        flex: 1, padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                        border: `2px solid ${active ? C.primaryDim : C.border}`,
                        background: active ? C.surfaceHigh : "none",
                        color: active ? C.text : C.muted,
                        fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700,
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="fb-message" style={{ display: "block", color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                Message
              </label>
              <textarea
                id="fb-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={type === "bug" ? "What happened? What did you expect?" : "Tell us what's on your mind..."}
                rows={7}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label htmlFor="fb-email" style={{ display: "block", color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                Your email <span style={{ color: C.muted, fontWeight: 500 }}>(optional, so we can reply)</span>
              </label>
              <input
                id="fb-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={!canSend}
              style={{
                marginTop: 4, padding: "14px 20px", borderRadius: 12, border: "none",
                background: canSend ? C.primary : C.border,
                color: canSend ? "#fff" : C.muted,
                fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800,
                cursor: canSend ? "pointer" : "not-allowed",
              }}
            >
              Submit
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
