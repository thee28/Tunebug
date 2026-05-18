"use client";

import { useEffect, useRef, useState } from "react";
import { getCsrfToken } from "next-auth/react";

export default function OAuthGoogle() {
  const formRef = useRef<HTMLFormElement>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    getCsrfToken().then((token) => setCsrfToken(token ?? ""));
  }, []);

  useEffect(() => {
    if (csrfToken !== null) {
      formRef.current?.submit();
    }
  }, [csrfToken]);

  return (
    <div style={{ background: "#121214", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "white", fontFamily: "sans-serif", opacity: 0.5 }}>Redirecting…</p>
      <form ref={formRef} method="POST" action="/api/auth/signin/google" style={{ display: "none" }}>
        <input type="hidden" name="callbackUrl" value="/oauth-close" />
        <input type="hidden" name="csrfToken" value={csrfToken ?? ""} />
      </form>
    </div>
  );
}
