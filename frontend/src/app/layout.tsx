import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { COLORS, FONTS } from "@/constants";
import SmoothScroll from "@/components/SmoothScroll";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-outfit",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-pjs",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jbm",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://prescottnational.com"),
  title: "Prescott National Bank — Institutional Digital Finance",
  description: "Secure online banking featuring instant P2P transfers, multi-currency accounts, virtual card management, and advanced stock portfolios.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate CSS properties dynamically from constants.ts
  const cssVariables = `
    :root {
      --background: ${COLORS.BACKGROUND};
      --card: ${COLORS.SURFACE};
      --primary: ${COLORS.PRIMARY};
      --primary-dark: ${COLORS.PRIMARY_DARK};
      --primary-light: ${COLORS.PRIMARY_LIGHT};
      --primary-muted: ${COLORS.PRIMARY_MUTED};
      --success: ${COLORS.SUCCESS};
      --error: ${COLORS.ERROR};
      --border: ${COLORS.BORDER};
      --input: ${COLORS.INPUT};
      --ring: ${COLORS.RING};
      --font-pjs: ${plusJakartaSans.style.fontFamily};
      --font-outfit: ${outfit.style.fontFamily};
      --font-jbm: ${jetbrainsMono.style.fontFamily};
    }
  `;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col relative bg-background text-foreground">
        {/* Cinematic film grain noise overlay */}
        <div className="fixed inset-0 z-50 bg-grain pointer-events-none" />
        
        <SmoothScroll>
          {children}
        </SmoothScroll>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
