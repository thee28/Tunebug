"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const nunito: React.CSSProperties = { fontFamily: "'Nunito', sans-serif" };

const glassInput: React.CSSProperties = {
  ...nunito,
  fontWeight: 700,
  fontSize: "16px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "2px solid rgba(255, 255, 255, 0.1)",
  outline: "none",
  transition: "all 0.2s ease",
  color: "white",
};

const socialBtn: React.CSSProperties = {
  ...nunito,
  fontWeight: 800,
  fontSize: "14px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "2px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 4px 0 0 rgba(255, 255, 255, 0.05)",
  color: "white",
  cursor: "pointer",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "signup">(
    searchParams.get("tab") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.background = "rgba(255, 255, 255, 0.08)";
    e.target.style.borderColor = "#574eb1";
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.background = "rgba(255, 255, 255, 0.05)";
    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (tab === "signup") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign up failed");
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  async function handleFacebook() {
    await signIn("facebook", { callbackUrl: "/dashboard" });
  }

  return (
    <div
      className="min-h-screen flex flex-col antialiased text-white"
      style={{ backgroundColor: "#121214" }}
    >
      {/* Header */}
      <header className="flex justify-between items-center px-5 md:px-10 h-20 w-full fixed top-0 z-50">
        <Link href="/">
          <span
            className="material-symbols-outlined cursor-pointer hover:text-white transition-colors"
            style={{ color: "rgba(200, 196, 212, 0.6)" }}
          >
            close
          </span>
        </Link>
        <button
          onClick={() => { setTab(tab === "login" ? "signup" : "login"); setError(""); }}
          className="px-6 py-2 rounded-xl uppercase transition-all hover:bg-white/10"
          style={socialBtn}
        >
          {tab === "login" ? "Sign Up" : "Log in"}
        </button>
      </header>

      {/* Main — vertically centered */}
      <main className="flex-grow flex items-center justify-center px-5 pt-20">
        <div className="w-full max-w-[400px] flex flex-col items-center">
          <h1
            className="mb-8 text-center text-white"
            style={{ ...nunito, fontWeight: 800, fontSize: "32px", lineHeight: "40px" }}
          >
            {tab === "login" ? "Log in" : "Sign up"}
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {tab === "signup" && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full h-14 px-5 rounded-2xl"
                style={glassInput}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or username"
              required
              className="w-full h-14 px-5 rounded-2xl"
              style={glassInput}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full h-14 px-5 rounded-2xl"
                style={glassInput}
                onFocus={focusInput}
                onBlur={blurInput}
              />
              {tab === "login" && (
                <a
                  href="#"
                  className="absolute right-5 top-1/2 -translate-y-1/2 hover:text-white transition-colors uppercase tracking-wider"
                  style={{ ...nunito, fontWeight: 700, fontSize: "12px", color: "rgba(120, 117, 131, 0.8)" }}
                >
                  Forgot?
                </a>
              )}
            </div>

            {error && (
              <p className="text-sm font-semibold bg-red-950/50 border border-red-500/30 rounded-xl px-3 py-2 text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl uppercase tracking-widest text-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                ...nunito,
                fontWeight: 800,
                fontSize: "18px",
                backgroundColor: "#574eb1",
                boxShadow: "0 4px 0 0 #41379b",
                transition: "transform 0.1s, box-shadow 0.1s",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 0 0 #41379b";
                }
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 0 0 #41379b";
              }}
            >
              {loading ? "Loading..." : tab === "signup" ? "Sign up" : "Log in"}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 my-8">
            <div className="h-[2px] flex-grow" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
            <span
              className="uppercase"
              style={{ ...nunito, fontWeight: 700, fontSize: "12px", color: "rgba(120, 117, 131, 0.8)" }}
            >
              or
            </span>
            <div className="h-[2px] flex-grow" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
          </div>

          {/* Social Buttons */}
          <div className="w-full grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogle}
              className="h-14 rounded-2xl flex items-center justify-center gap-3 uppercase transition-all hover:bg-white/10"
              style={socialBtn}
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoK-6FfSkqCsWhpKxKMU-734ze78Osveq0ULN-Y08GxbKojqcFtGOYlUgNj9Y_03vo54We5UKDwpJpqY8JoagFSXFb3LFZsiooENDaF5Rpj_RB6j669jxGasxDteortBhfM9UCYNq9yiwuz5iCg0e6cKhw-lOjWa43VIjqEtX2WZREJJDnvooBimZkaP8O0vJQvvnvp_m8gBBovKJTz5O_eASdtRX7VU25EN7hQAThh7vF6KhV2LVsKN1f7n3npRRowg361zByeM_Z"
                alt="Google"
                className="w-5 h-5"
              />
              Google
            </button>
            <button
              onClick={handleFacebook}
              className="h-14 rounded-2xl flex items-center justify-center gap-3 uppercase transition-all hover:bg-white/10"
              style={socialBtn}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          {/* Legal */}
          <footer className="mt-12 text-center max-w-[320px] pb-8">
            <p className="leading-relaxed" style={{ fontSize: "12px", color: "rgba(120, 117, 131, 0.6)" }}>
              By signing in to Tunebug, you agree to our{" "}
              <a href="#" className="hover:text-white transition-colors" style={{ ...nunito, fontWeight: 700, color: "rgba(120, 117, 131, 0.9)" }}>
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="hover:text-white transition-colors" style={{ ...nunito, fontWeight: 700, color: "rgba(120, 117, 131, 0.9)" }}>
                Privacy Policy
              </a>.
            </p>
            <p className="mt-4 leading-relaxed uppercase tracking-tighter" style={{ fontSize: "10px", color: "rgba(120, 117, 131, 0.4)" }}>
              This site is protected by reCAPTCHA Enterprise and the Google{" "}
              <a href="#" className="hover:text-white underline underline-offset-2">Privacy Policy</a>{" "}
              and{" "}
              <a href="#" className="hover:text-white underline underline-offset-2">Terms of Service</a>{" "}
              apply.
            </p>
          </footer>
        </div>
      </main>

      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            top: "-10%", right: "-10%", width: "40%", height: "40%",
            background: "rgba(87, 78, 177, 0.1)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: "-10%", left: "-10%", width: "40%", height: "40%",
            background: "rgba(0, 108, 78, 0.1)",
            filter: "blur(120px)",
          }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
