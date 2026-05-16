import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuneBug — Learn Music by Ear",
  description:
    "Master pitch, sight reading, and ear training with interactive lessons and real-time pitch detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#EEF2FF]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
