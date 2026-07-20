import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  // Next.js requires inline scripts for hydration; dev needs eval for HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // data: is required for VexFlow, which ships its music font (Bravura) as a
  // base64 data URL. Without it every staff renders placeholder squares.
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // Google OAuth signs in via a form POST that 302-redirects to Google.
  // Browsers enforce form-action against redirect targets, so the sign-in host
  // must be allowlisted or the redirect is blocked (stuck on "Redirecting…").
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
  // Force any accidental http:// subresource to upgrade to https.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // Next refuses two dev servers sharing one distDir (lockfile). E2E runs its
  // own dev server on :3100, so give it a separate build dir.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  turbopack: {
    root: __dirname,
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
