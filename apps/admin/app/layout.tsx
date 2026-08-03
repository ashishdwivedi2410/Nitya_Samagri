// apps/admin/app/layout.tsx
// Admin Panel — nityasamagri

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
  title:       "nityasamagri Admin Panel",
  description: "Manage orders, products, users and reports for nityasamagri",
  robots:      { index: false, follow: false }, // never index admin panel
  icons: {
    icon:     "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple:    "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor:   "#0D0D0F",
  width:        "device-width",
  initialScale: 1,
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
