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

function EnvBanner() {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  const isDev = !vercelEnv && process.env.NODE_ENV === "development";
  const isPreview = vercelEnv === "preview";

  if (!isDev && !isPreview) return null;

  const label = isPreview ? "STAGING" : "DEV";
  const color = isPreview
    ? "bg-orange-500 text-white"
    : "bg-violet-600 text-white";

  return (
    <div className={`${color} text-center text-xs font-bold py-1 tracking-wider`}>
      {label} BUILD
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <EnvBanner />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
