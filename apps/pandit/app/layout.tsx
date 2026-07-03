// apps/pandit/app/layout.tsx
// Pandit Ji Panel — TheKhatuMart

import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-inter",
  display:  "swap",
});

const playfair = Playfair_Display({
  subsets:  ["latin"],
  variable: "--font-playfair",
  display:  "swap",
  weight:   ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title:       "KhatuMart Pandit Panel",
  description: "Manage your bookings, availability and earnings — TheKhatuMart",
  robots:      { index: false, follow: false },
  manifest:    "/manifest.json",
  icons: {
    icon:     "/favicon.ico",
    apple:    "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor:   "#1C1008",
  width:        "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}