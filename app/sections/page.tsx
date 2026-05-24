import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStagesWithProgress } from "@/lib/db/stages";
import SectionList from "@/components/dashboard/SectionList";

const C = {
  dark: "#0F0F13",
  border: "#33313D",
  muted: "#938F99",
  text: "#f3eff5",
};

export default async function SectionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stages = await getStagesWithProgress(session.user.id);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.dark, color: C.text }}>
      <div style={{ padding: "20px 20px 0" }}>
        <a
          href="/dashboard"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: C.muted, textDecoration: "none",
            fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          Back
        </a>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 64px" }}>
        <h1
          style={{
            color: C.text, fontFamily: "'Nunito', sans-serif",
            fontSize: 22, fontWeight: 900, margin: "0 0 20px",
          }}
        >
          All Sections
        </h1>
        <SectionList stages={stages} />
      </div>
    </div>
  );
}
