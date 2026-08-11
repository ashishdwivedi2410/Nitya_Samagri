// apps/admin/next.config.ts
// Admin Panel — nityasamagri

import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  output: "standalone",

  // ── Image domains ─────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "nityasamagri-media.s3.ap-south-1.amazonaws.com" },
      { protocol: "https", hostname: "nityasamagri-media.s3.amazonaws.com" },
      { protocol: "https", hostname: "d1234abcd.cloudfront.net" },
      { protocol: "https", hostname: "nityasamagri.com" },
    ],
    formats:         ["image/webp", "image/avif"],
    minimumCacheTTL: 3600,
  },

  // ── Env vars ──────────────────────────────────────────────────────────────
  env: {
    NEXT_PUBLIC_APP_NAME:  "nityasamagri Admin",
    NEXT_PUBLIC_APP_URL:   process.env.NEXT_PUBLIC_APP_URL  || "https://admin.nityasamagri.com",
    NEXT_PUBLIC_API_URL:   process.env.NEXT_PUBLIC_API_URL  || "http://localhost:4000/api/v1",
    NEXT_PUBLIC_WS_URL:    process.env.NEXT_PUBLIC_WS_URL   || "ws://localhost:4000/ws",
  },

  // ── Strict security — admin must not be iframe-able ───────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",       value: "DENY" },           // stricter than SAMEORIGIN
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection",       value: "1; mode=block" },
          { key: "Referrer-Policy",        value: "no-referrer" },
          {
            key:   "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.nityasamagri.com wss://api.nityasamagri.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          // Prevent admin panel being cached by CDN / proxies
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma",        value: "no-cache" },
        ],
      },
      // Static assets can be cached
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  // ── Redirect root → login (RequireAuth forwards authed users to /dashboard) ─
  async redirects() {
    return [
      { source: "/", destination: "/login", permanent: false },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  experimental: {
    optimizePackageImports: ["recharts", "date-fns"],
  },

  typescript:      { ignoreBuildErrors: false },
  poweredByHeader: false,
};

export default nextConfig;