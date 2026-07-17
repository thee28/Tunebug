import InfoPageLayout, { InfoSection } from "@/components/InfoPageLayout";

export const metadata = { title: "Terms of Service · Tunebug" };

export default function TermsPage() {
  return (
    <InfoPageLayout crumb="Terms" title="Terms of Service">
      <InfoSection title="Using Tunebug">
        <p>
          Tunebug is a free ear-training and music-learning app. By creating an account you agree
          to these terms. You must provide accurate account information and keep your password
          secure — you&apos;re responsible for activity on your account.
        </p>
      </InfoSection>

      <InfoSection title="Fair play">
        <p>
          Leaderboards and leagues are part of the fun. Don&apos;t automate lesson completion,
          exploit bugs to farm XP, or otherwise game the ranking systems. We may reset progress or
          suspend accounts that abuse them.
        </p>
      </InfoSection>

      <InfoSection title="Your content and data">
        <p>
          Your learning progress belongs to you. You can export it or delete your account at any
          time from Settings → Profile. See our{" "}
          <a href="/privacy" style={{ color: "#c5c0ff" }}>Privacy Policy</a> for details on how we
          handle your data.
        </p>
      </InfoSection>

      <InfoSection title="The fine print">
        <p>
          Tunebug is provided &quot;as is&quot; without warranties of any kind. We may update the
          app, lessons, or these terms over time; continued use means you accept the updated
          terms. If a change is significant, we&apos;ll let you know in the app.
        </p>
        <p>
          Questions? Reach us at support@tunebug.app.
        </p>
      </InfoSection>
    </InfoPageLayout>
  );
}
