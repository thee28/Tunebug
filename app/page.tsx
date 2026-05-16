import Link from "next/link";

function TunebugMascot() {
  return (
    <svg viewBox="0 0 220 230" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
      {/* Wings */}
      <ellipse cx="62" cy="148" rx="50" ry="68" fill="#c5c0ff" opacity="0.9" transform="rotate(-18 62 148)" />
      <ellipse cx="158" cy="148" rx="50" ry="68" fill="#c5c0ff" opacity="0.9" transform="rotate(18 158 148)" />
      <ellipse cx="64" cy="148" rx="32" ry="50" fill="#e4dfff" opacity="0.6" transform="rotate(-18 64 148)" />
      <ellipse cx="156" cy="148" rx="32" ry="50" fill="#e4dfff" opacity="0.6" transform="rotate(18 156 148)" />

      {/* Body */}
      <ellipse cx="110" cy="168" rx="56" ry="58" fill="#574eb1" />
      <ellipse cx="110" cy="168" rx="56" ry="58" fill="url(#bodyGrad)" />

      {/* Body center line */}
      <line x1="110" y1="112" x2="110" y2="222" stroke="#41379b" strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />

      {/* Body spots */}
      <circle cx="84" cy="152" r="11" fill="#41379b" opacity="0.45" />
      <circle cx="136" cy="152" r="11" fill="#41379b" opacity="0.45" />
      <circle cx="84" cy="182" r="9" fill="#41379b" opacity="0.45" />
      <circle cx="136" cy="182" r="9" fill="#41379b" opacity="0.45" />

      {/* Neck */}
      <rect x="92" y="88" width="36" height="24" rx="12" fill="#574eb1" />

      {/* Head */}
      <circle cx="110" cy="74" r="44" fill="#574eb1" />
      <ellipse cx="94" cy="58" rx="14" ry="9" fill="#7067cc" opacity="0.35" />

      {/* Eyes */}
      <ellipse cx="93" cy="71" rx="13" ry="15" fill="white" />
      <ellipse cx="127" cy="71" rx="13" ry="15" fill="white" />
      <circle cx="96" cy="73" r="7" fill="#1b1b1f" />
      <circle cx="130" cy="73" r="7" fill="#1b1b1f" />
      <circle cx="99" cy="69" r="2.5" fill="white" />
      <circle cx="133" cy="69" r="2.5" fill="white" />

      {/* Smile */}
      <path d="M97 90 Q110 102 123 90" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* Blush */}
      <ellipse cx="76" cy="82" rx="9" ry="5.5" fill="#83f5c6" opacity="0.55" />
      <ellipse cx="144" cy="82" rx="9" ry="5.5" fill="#83f5c6" opacity="0.55" />

      {/* Antennae */}
      <path d="M96 32 Q80 14 74 5" stroke="#474552" strokeWidth="3" strokeLinecap="round" />
      <path d="M124 32 Q140 14 146 5" stroke="#474552" strokeWidth="3" strokeLinecap="round" />
      <circle cx="73" cy="4" r="7" fill="#83f5c6" />
      <text x="67" y="8" fontSize="9" fill="#00513a" fontWeight="800">♪</text>
      <circle cx="147" cy="4" r="7" fill="#83f5c6" />
      <text x="141" y="8" fontSize="9" fill="#00513a" fontWeight="800">♫</text>

      {/* Legs */}
      <path d="M60 170 Q40 165 32 155" stroke="#474552" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M62 190 Q42 188 35 180" stroke="#474552" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M62 208 Q44 210 38 204" stroke="#474552" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M160 170 Q180 165 188 155" stroke="#474552" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M158 190 Q178 188 185 180" stroke="#474552" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M158 208 Q176 210 182 204" stroke="#474552" strokeWidth="3.5" strokeLinecap="round" />

      <defs>
        <radialGradient id="bodyGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#7067cc" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#41379b" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const pills = [
  { emoji: "🎤", label: "Vocals" },
  { emoji: "🎵", label: "Theory" },
  { emoji: "👂", label: "Ear Training" },
  { emoji: "🎼", label: "Sight Singing" },
];

const stats = [
  { value: "500K+", label: "Learners worldwide" },
  { value: "4", label: "Skill trees" },
  { value: "100%", label: "Free forever" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e4e1e7]">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto w-full">
          <span className="text-2xl font-extrabold text-[#574eb1]" style={{ fontFamily: "'Syne', sans-serif" }}>
            tunebug
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl font-bold text-[#574eb1] border-2 border-[#574eb1] hover:bg-[#f0edf3] transition-colors text-sm"
            >
              Log In
            </Link>
            <Link
              href="/login?tab=signup"
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#574eb1] btn-primary text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Text */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
            <h1
              className="text-5xl sm:text-6xl font-extrabold text-[#1b1b1f] leading-[1.1]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              The free, fun, and<br />
              <span className="text-[#574eb1]">effective way</span><br />
              to learn music!
            </h1>
            <p className="text-lg text-[#474552] max-w-md leading-relaxed">
              Master pitch, intervals, sight reading, and ear training — one daily lesson at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/login?tab=signup"
                className="px-8 py-4 rounded-2xl font-extrabold text-lg text-white bg-[#006c4e] btn-teal text-center"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-2xl font-extrabold text-lg text-[#474552] border-2 border-[#c8c4d4] hover:bg-[#f0edf3] transition-colors text-center"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                I already have an account
              </Link>
            </div>
          </div>

          {/* Mascot */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              <TunebugMascot />
              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 bg-white rounded-2xl px-3 py-2 shadow-lg border border-[#e4e1e7] flex items-center gap-2 animate-bounce" style={{ animationDuration: '2.5s' }}>
                <span className="text-lg">🔥</span>
                <span className="font-bold text-[#1b1b1f] text-sm">7-day streak!</span>
              </div>
              <div className="absolute -bottom-3 -left-3 bg-white rounded-2xl px-3 py-2 shadow-lg border border-[#e4e1e7] flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="font-bold text-[#1b1b1f] text-sm">+10 XP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature pills */}
      <section className="max-w-6xl mx-auto px-6 pb-16 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {pills.map((p) => (
            <div
              key={p.label}
              className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white border-2 border-[#e4e1e7] hover:border-[#c5c0ff] hover:shadow-md transition-all cursor-default"
            >
              <span className="text-4xl">{p.emoji}</span>
              <span className="font-bold text-[#1b1b1f] text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#574eb1] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-around gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center text-white">
              {i > 0 && <div className="hidden sm:block absolute w-px h-12 bg-[#7067cc]" />}
              <span className="text-4xl font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>
                {s.value}
              </span>
              <span className="text-[#c5c0ff] font-medium mt-1 text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature 1: Master your voice */}
      <section className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 bg-gradient-to-br from-[#83f5c6] to-[#006c4e] rounded-3xl h-64 sm:h-72 flex items-center justify-center shadow-xl">
            <span className="text-[100px] select-none drop-shadow-lg">🎤</span>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#006c4e]">Real-time feedback</p>
            <h2 className="text-4xl font-extrabold text-[#1b1b1f] leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Master your voice.<br />
              <span className="text-[#574eb1]">Any time. Anywhere.</span>
            </h2>
            <p className="text-[#474552] text-lg leading-relaxed">
              Sing into your mic and get instant pitch feedback. Daily drills build your ear and voice one note at a time — no instruments required.
            </p>
          </div>
        </div>
      </section>

      {/* Feature 2: Tuned for precision */}
      <section className="bg-[#f0edf3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
            <div className="flex-1 bg-gradient-to-br from-[#e4dfff] to-[#574eb1] rounded-3xl h-64 sm:h-72 flex items-center justify-center shadow-xl">
              <span className="text-[100px] select-none drop-shadow-lg">🧠</span>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#574eb1]">Science-backed</p>
              <h2 className="text-4xl font-extrabold text-[#1b1b1f] leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                Tuned for<br />
                <span className="text-[#574eb1]">Precision</span>
              </h2>
              <p className="text-[#474552] text-lg leading-relaxed">
                Our proprietary pitch-tracking technology and vocal pedagogy framework — designed by experts — follows every note you sing with surgical accuracy.
              </p>
              <Link
                href="/login?tab=signup"
                className="self-start mt-2 px-7 py-3 rounded-xl font-bold text-white bg-[#574eb1] btn-primary text-sm"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Streak / gamification */}
      <section className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 bg-gradient-to-br from-[#ffddb7] to-[#825100] rounded-3xl h-64 sm:h-72 flex items-center justify-center shadow-xl">
            <span className="text-[100px] select-none drop-shadow-lg">🔥</span>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#825100]">Stay motivated</p>
            <h2 className="text-4xl font-extrabold text-[#1b1b1f] leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Build your streak.<br />
              <span className="text-[#574eb1]">Never miss a day.</span>
            </h2>
            <p className="text-[#474552] text-lg leading-relaxed">
              Unlock stages from Beginner to Advanced. Daily streak bonuses keep you on track. Progress through skill trees and earn XP with every lesson.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#574eb1] py-20 px-6 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
          Ready to play the rhythm?
        </h2>
        <p className="text-[#c5c0ff] mb-8 text-lg">Join Tunebug — completely free, forever.</p>
        <Link
          href="/login?tab=signup"
          className="inline-block px-12 py-4 rounded-2xl font-extrabold text-xl text-[#574eb1] bg-white btn-white"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e4e1e7] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-extrabold text-[#574eb1]" style={{ fontFamily: "'Syne', sans-serif" }}>
            tunebug
          </span>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#474552]">
            <a href="#" className="hover:text-[#574eb1] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#574eb1] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#574eb1] transition-colors">Support</a>
            <a href="#" className="hover:text-[#574eb1] transition-colors">Careers</a>
          </nav>
          <p className="text-sm text-[#787583]">© 2024 Tunebug Music. Play the rhythm.</p>
        </div>
      </footer>

    </main>
  );
}
