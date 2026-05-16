import Link from "next/link";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
    ),
    title: "Pitch Matching",
    desc: "Sing notes and get real-time feedback with mic-powered pitch detection.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
      </svg>
    ),
    title: "Sight Reading",
    desc: "Read sheet music and tap the right key on an interactive piano.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Ear Training",
    desc: "Hear notes and chords, then identify them — train your musical ear.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Interval ID",
    desc: "Identify the distance between notes — from unison to octave.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    ),
    title: "Stage Progression",
    desc: "Unlock stages from Beginner to Advanced — just like Duolingo.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <span className="text-2xl font-bold text-[#4F46E5]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
          🐛 TuneBug
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-2xl font-bold text-[#4F46E5] border-2 border-[#4F46E5] hover:bg-[#4F46E5] hover:text-white transition-colors duration-200 cursor-pointer"
          >
            Log In
          </Link>
          <Link
            href="/login?tab=signup"
            className="px-5 py-2 rounded-2xl font-bold text-white bg-[#4F46E5] clay clay-press cursor-pointer hover:bg-[#3730A3] transition-colors duration-200"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-12 pb-16 max-w-3xl mx-auto">
        <div className="text-7xl mb-4 select-none">🎵</div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-[#312E81] leading-tight mb-4" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
          Learn Music<br />
          <span className="text-[#4F46E5]">by Ear</span>
        </h1>
        <p className="text-xl text-[#6366F1] font-semibold mb-8 max-w-lg">
          Interactive pitch training, sight reading, and ear exercises — leveled from Beginner to Advanced.
        </p>
        <Link
          href="/login?tab=signup"
          className="inline-block px-10 py-4 rounded-2xl font-extrabold text-xl text-white bg-[#22C55E] clay-green clay-press cursor-pointer hover:bg-[#16A34A] transition-colors duration-200"
          style={{ fontFamily: "'Baloo 2', sans-serif" }}
        >
          Start for Free →
        </Link>
        <p className="mt-3 text-sm text-[#818CF8]">No credit card. No downloads.</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20 w-full">
        <h2 className="text-3xl font-bold text-center text-[#312E81] mb-10" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
          5 Ways to Train Your Ear
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-6 clay flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-[#312E81]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
                {f.title}
              </h3>
              <p className="text-[#6366F1] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-[#4F46E5] py-16 px-6 text-center mt-auto">
        <h2 className="text-3xl font-extrabold text-white mb-3" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
          Ready to tune up?
        </h2>
        <p className="text-[#C7D2FE] mb-6 text-lg">Join TuneBug and start your streak today.</p>
        <Link
          href="/login?tab=signup"
          className="inline-block px-10 py-4 rounded-2xl font-extrabold text-xl text-[#4F46E5] bg-white clay-press cursor-pointer hover:bg-[#EEF2FF] transition-colors duration-200"
          style={{ fontFamily: "'Baloo 2', sans-serif", boxShadow: "0 4px 0 0 #3730A3" }}
        >
          Get Started Free
        </Link>
      </section>
    </main>
  );
}
