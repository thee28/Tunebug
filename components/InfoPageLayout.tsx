import Link from "next/link";

const C = {
  dark: "var(--c-dark)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)", primaryDim: "#c5c0ff", accent: "#c5c0ff",
};

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, border: `2px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ color: C.accent, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800 }}>
          {title}
        </span>
      </div>
      <div style={{
        padding: "18px 24px", color: C.muted, fontFamily: "'Nunito', sans-serif",
        fontSize: 14, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 12,
      }}>
        {children}
      </div>
    </div>
  );
}

export default function InfoPageLayout({
  crumb, title, children,
}: {
  crumb: string; title: string; children: React.ReactNode;
}) {
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
        <Link href="/" style={{ color: C.accent, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}>
          Home
        </Link>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.muted }}>chevron_right</span>
        <span style={{ color: C.accent, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {crumb}
        </span>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>
        <h1 style={{
          color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 900,
          textAlign: "center", margin: "0 0 40px",
        }}>
          {title}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
