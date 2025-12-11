import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import Header from "@/components/landing/Header";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChoreBid – Hire trusted locals for your chores",
  description:
    "Post household chores and get bids from trusted local workers. Compare profiles, chat, and get things done safely with ChoreBid.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://chorebid.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ChoreBid – Get your chores done",
    description:
      "A chore marketplace where customers post tasks and workers apply. Built for India with rupee pricing and local availability.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://chorebid.in",
    siteName: "ChoreBid",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ChoreBid – Find help for your chores",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChoreBid – Get your chores done",
    description:
      "Post chores, get bids from local workers, and hire safely on ChoreBid.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
