// apps/pandit/next.config.ts
// Pandit Ji Panel — TheKhatuMart

import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  output: "standalone",

  // ── PWA-ready: manifest + service worker headers ──────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "khatumart-media.s3.ap-south-1.amazonaws.com" },
      { protocol: "https", hostname: "khatumart-media.s3.amazonaws.com" },
      { protocol: "https", hostname: "thekhatumart.com" },
    ],
    formats:         ["image/webp", "image/avif"],
    minimumCacheTTL: 3600,
  },

  // ── Env vars ──────────────────────────────────────────────────────────────
  env: {
    NEXT_PUBLIC_APP_NAME:  "KhatuMart Pandit",
    NEXT_PUBLIC_APP_URL:   process.env.NEXT_PUBLIC_APP_URL  || "https://pandit.thekhatumart.com",
    NEXT_PUBLIC_API_URL:   process.env.NEXT_PUBLIC_API_URL  || "http://localhost:4000/api/v1",
    NEXT_PUBLIC_WS_URL:    process.env.NEXT_PUBLIC_WS_URL   || "ws://localhost:4000/ws",
  },

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          {
            key:   "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.thekhatumart.com wss://api.thekhatumart.com",
              // Allow Zoom/Meet for online puja
              "frame-src https://zoom.us https://meet.google.com",
            ].join("; "),
          },
        ],
      },
      // PWA manifest — no cache
      {
        source:  "/manifest.json",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      // Static assets
      {
        source:  "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      { source: "/",      destination: "/dashboard",    permanent: false },
      { source: "/login", destination: "/dashboard",    permanent: false },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  experimental: {
    optimizePackageImports: ["date-fns"],
  },

  typescript:      { ignoreBuildErrors: false },
  eslint:          { ignoreDuringBuilds: false },
  poweredByHeader: false,
};

export default nextConfig;
