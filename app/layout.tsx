import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getMetadataBaseUrl } from "@/lib/auth-env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

function getMetadataBase() {
  try {
    return new URL(getMetadataBaseUrl());
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "Office Tracker",
  description: "Office day tracker with calendar, summaries, and authentication."
};

export default function RootLayout({
  children
}: Readonly<{
  children: import("react").ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
