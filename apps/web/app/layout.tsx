// apps/web/app/layout.tsx
// Customer Storefront — nityasamagri

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
  metadataBase: new URL("https://nityasamagri.com"),
  title: {
    default:  "nityasamagri — Pure Puja Samagri",
    template: "%s | nityasamagri",
  },
  description:
    "India's most trusted puja samagri platform. Order temple-grade puja samagri and get it delivered anywhere in India.",
  keywords: [
    "puja samagri online",
    "hawan samagri",
    "cow ghee for puja",
    "navratri puja kit",
    "nityasamagri",
    "online puja store india",
    "buy puja items online",
  ],
  authors:   [{ name: "nityasamagri", url: "https://nityasamagri.com" }],
  creator:   "nityasamagri",
  publisher: "nityasamagri",
  robots: {
    index:     true,
    follow:    true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type:        "website",
    locale:      "en_IN",
    url:         "https://nityasamagri.com",
    siteName:    "nityasamagri",
    title:       "nityasamagri — Pure Puja Samagri",
    description: "Order pure, temple-grade puja samagri online. Delivered anywhere in India.",
    images: [
      {
        url:    "/og-image.jpg",
        width:  1200,
        height: 630,
        alt:    "nityasamagri — Simplifying Your Spiritual Journey",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "nityasamagri — Pure Puja Samagri",
    description: "India's trusted puja samagri platform.",
    images:      ["/og-image.jpg"],
    creator:     "@nityasamagri",
  },
  icons: {
    icon:        [{ url: "/favicon.ico" }, { url: "/favicon-32x32.png", sizes: "32x32" }],
    apple:       "/apple-touch-icon.png",
    shortcut:    "/favicon-16x16.png",
  },
  manifest: "/manifest.json",
  category: "shopping",
};

export const viewport: Viewport = {
  themeColor:   "#E8560A",
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
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="font-sans bg-cream antialiased min-h-screen">
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-saffron focus:text-white focus:rounded"
        >
          Skip to main content
        </a>

        <main id="main-content">
          {children}
        </main>

        {/* Razorpay checkout script */}
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
        />
      </body>
    </html>
  );
}