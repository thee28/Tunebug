"use client";

import { signOut } from "next-auth/react";

const C = {
  border: "#33313D", muted: "#938F99", text: "#f3eff5",
  surfaceHigh: "#211F26",
};

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        width: "100%", padding: "14px 0", borderRadius: 14,
        backgroundColor: "transparent",
        border: `2px solid ${C.border}`,
        color: "#1cb0f6",
        fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
        letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
        transition: "background-color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.surfaceHigh)}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      Log Out
    </button>
  );
}
