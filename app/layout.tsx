import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chore Marketplace",
  description: "Connect customers with workers for completing chores and tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="w-full bg-white shadow p-4">
          <div className="mx-auto max-w-7xl flex gap-6 items-center">
            <Link
              href="/"
              className="text-gray-900 hover:text-blue-600 font-medium"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-900 hover:text-blue-600 font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/chores"
              className="text-gray-900 hover:text-blue-600 font-medium"
            >
              Browse Chores
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
