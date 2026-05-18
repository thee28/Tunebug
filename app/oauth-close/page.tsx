"use client";

import { useEffect } from "react";

export default function OAuthClose() {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage("oauth-complete", window.location.origin);
    }
    window.close();
  }, []);

  return (
    <div style={{ background: "#121214", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "white", fontFamily: "sans-serif" }}>Signing in…</p>
    </div>
  );
}
