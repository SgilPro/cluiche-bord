import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Cluiche Bord",
  description:
    "A modern board game platform for playing and managing your favorite games",
  keywords: ["board games", "gaming", "online games", "game platform"],
  authors: [{ name: "Cluiche Bord Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cluiche-bord.vercel.app",
    title: "Cluiche Bord",
    description:
      "A modern board game platform for playing and managing your favorite games",
    siteName: "Cluiche Bord",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cluiche Bord",
    description:
      "A modern board game platform for playing and managing your favorite games",
  },
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
        {children}
      </body>
    </html>
  );
}
