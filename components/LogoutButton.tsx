"use client";

import { signOut } from "next-auth/react";

const C = {
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  surfaceHigh: "var(--c-surface-high)",
};

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        width: "100%", padding: "14px 0", borderRadius: 14,
        backgroundColor: "transparent",
        border: `2px solid ${C.border}`,
        color: "#574eb1",
        fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
        letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
        transition: "background-color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = "rgba(87,78,177,0.1)";
        e.currentTarget.style.borderColor = "rgba(87,78,177,0.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      Log Out
    </button>
  );
}
