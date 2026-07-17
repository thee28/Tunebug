import InfoPageLayout, { InfoSection } from "@/components/InfoPageLayout";

export const metadata = { title: "Privacy Policy · Tunebug" };

export default function PrivacyPage() {
  return (
    <InfoPageLayout crumb="Privacy" title="Privacy Policy">
      <InfoSection title="What we collect">
        <p>
          When you create an account we store your email address, display name, and a securely
          hashed password. As you learn, we record your lesson progress, XP, streaks, and league
          placement so the app can pick up where you left off.
        </p>
      </InfoSection>

      <InfoSection title="Your microphone">
        <p>
          Pitch detection for singing exercises happens entirely on your device, in your browser.
          Your audio is never recorded, stored, or uploaded to our servers — only the resulting
          score of an exercise is saved to your account.
        </p>
      </InfoSection>

      <InfoSection title="What we don't do">
        <p>
          We don&apos;t sell your data. We don&apos;t share your personal information with
          advertisers. We don&apos;t track you across other websites.
        </p>
      </InfoSection>

      <InfoSection title="Your controls">
        <p>
          You can export a copy of your data or permanently delete your account at any time from
          Settings → Profile. Deleting your account removes your personal information and progress
          from our systems.
        </p>
        <p>
          Questions? Reach us at privacy@tunebug.app.
        </p>
      </InfoSection>
    </InfoPageLayout>
  );
}
