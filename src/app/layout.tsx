import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
  metadataBase: new URL("https://sopia.xyz"),
  title: {
    default: "Sopia",
    template: "%s | Sopia",
  },
  description: "Senior expertise where it matters. AI guidance everywhere else. Sopia walks your team through every procedure step by step.",
  openGraph: {
    title: "Sopia",
    description: "Senior expertise where it matters. AI guidance everywhere else.",
    siteName: "Sopia",
    locale: "en",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sopia",
    description: "Senior expertise where it matters. AI guidance everywhere else.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
