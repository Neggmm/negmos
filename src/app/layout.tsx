import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

// --- Typography ---------------------------------------------------------------
// Inter           — body sans (universal, premium, geometric)
// JetBrains Mono  — mono (PIN entry, numeric data, code)
// Outfit          — display (NEGM OS wordmark, hero text)
//
// Each font's `variable` option writes its family stack into the matching
// CSS custom property defined in globals.css :root. That indirection means
// components never hardcode font names — they just reference var(--font-*).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "NEGM OS",
  title: {
    default: "NEGM OS",
    template: "%s · NEGM OS",
  },
  description:
    "NEGM OS — a cinematic personal operating system. Finance, calendar, and tasks in one immersive dark shell.",
  authors: [{ name: "Dr. NEGM" }],
  keywords: [
    "NEGM OS",
    "personal operating system",
    "finance",
    "calendar",
    "tasks",
    "dashboard",
  ],
  openGraph: {
    type: "website",
    siteName: "NEGM OS",
    title: "NEGM OS",
    description:
      "A cinematic personal operating system. Finance, calendar, and tasks in one immersive dark shell.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEGM OS",
    description:
      "A cinematic personal operating system. Finance, calendar, and tasks in one immersive dark shell.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050608",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${outfit.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
