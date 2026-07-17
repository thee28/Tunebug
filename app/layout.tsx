import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuneBug | Learn Music by Ear",
  description:
    "Learn pitch, sight reading, and ear training with short interactive lessons and real-time pitch detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=Syne:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* display=block is deliberate: with swap, icon ligatures flash as raw
            text ("check_circle") until the font loads. Block hides that.
            icon_names subsets the font to just the glyphs the app renders
            (~8 KB instead of the full ~3.9 MB set — it was the LCP bottleneck).
            ADDING AN ICON? Append its name here, keeping the list ALPHABETICAL
            (Google Fonts rejects unsorted icon_names). */}
        {/* eslint-disable-next-line @next/next/google-font-display */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=arrow_back,arrow_downward,arrow_upward,auto_awesome,auto_stories,bedtime,bolt,cancel,check,check_circle,chevron_right,close,compare_arrows,diamond,done,emoji_events,expand_more,fast_forward,favorite,flag,gps_fixed,graphic_eq,groups,hearing,heart_broken,history,library_music,local_fire_department,lock,lyrics,menu_book,mic,mic_off,military_tech,music_note,person,piano,play_arrow,play_circle,podcasts,public,queue_music,replay,rocket_launch,schedule,school,sentiment_neutral,settings,shuffle,star,stars,timer_off,tips_and_updates,today,unfold_more,visibility,visibility_off,volume_up,warning,whatshot,workspace_premium&display=block" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
