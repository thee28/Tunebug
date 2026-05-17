"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-[#EEF2FF] flex flex-col items-center justify-center px-4">
      <Link href="/" className="text-2xl font-bold text-[#4F46E5] mb-8 cursor-pointer" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
        Log in
      </Link>

      <div className="bg-white clay w-full max-w-md p-8">
        {/* Tabs */}
        <div className="flex rounded-2xl overflow-hidden border-2 border-[#3730A3] mb-6">
          <button
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 py-2.5 font-bold text-sm transition-colors duration-200 cursor-pointer ${
              tab === "login" ? "bg-[#4F46E5] text-white" : "bg-white text-[#6366F1] hover:bg-[#EEF2FF]"
            }`}
            style={{ fontFamily: "'Baloo 2', sans-serif" }}
          >
            Log In
          </button>
          <button
            onClick={() => { setTab("signup"); setError(""); }}
            className={`flex-1 py-2.5 font-bold text-sm transition-colors duration-200 cursor-pointer ${
              tab === "signup" ? "bg-[#4F46E5] text-white" : "bg-white text-[#6366F1] hover:bg-[#EEF2FF]"
            }`}
            style={{ fontFamily: "'Baloo 2', sans-serif" }}
          >
            Sign Up
          </button>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2 border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-colors duration-200 cursor-pointer font-semibold text-[#312E81] mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#E5E7EB]" />
          <span className="text-sm text-[#9CA3AF] font-medium">or</span>
          <div className="flex-1 h-px bg-[#E5E7EB]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === "signup" && (
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-[#312E81] mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#C7D2FE] bg-[#EEF2FF] text-[#312E81] font-medium placeholder-[#A5B4FC] focus:outline-none focus:border-[#4F46E5] transition-colors"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-[#312E81] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#C7D2FE] bg-[#EEF2FF] text-[#312E81] font-medium placeholder-[#A5B4FC] focus:outline-none focus:border-[#4F46E5] transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-[#312E81] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "signup" ? "Min. 8 characters" : "Your password"}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#C7D2FE] bg-[#EEF2FF] text-[#312E81] font-medium placeholder-[#A5B4FC] focus:outline-none focus:border-[#4F46E5] transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 font-semibold bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-extrabold text-white bg-[#4F46E5] clay clay-press cursor-pointer hover:bg-[#3730A3] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Baloo 2', sans-serif" }}
          >
            {loading ? "Loading..." : tab === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>
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
