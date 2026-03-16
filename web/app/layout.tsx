import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";

import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

const displayFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Mofitness - Africa's AI Fitness Platform",
  description:
    "AI-powered fitness coaching, verified coaches, local events, and a unified coach network across web and mobile.",
  openGraph: {
    title: "Mofitness",
    description:
      "Find verified coaches, register for events, and train with Africa's AI fitness platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-background text-foreground antialiased`}>
        <div className="min-h-screen">
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
