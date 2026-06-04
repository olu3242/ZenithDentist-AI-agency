import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { env } from "@/lib/env";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { DatabaseProvider } from "@/components/providers/database-provider";
import { BrandProvider } from "@/providers/brand-provider";
import { GlobalThemeProvider } from "@/providers/global-theme-provider";
import { brandConfig } from "@/lib/brand";
import { LizChatWidget } from "@/components/public/liz-chat-widget";
import { CookieConsent } from "@/components/privacy/cookie-consent";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zenithprosai.com"),
  title: {
    default: "Zenith Pros",
    template: `%s | ${brandConfig.name}`
  },
  description: "Patient Revenue Operating System",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  openGraph: {
    title: "Zenith Pros",
    description: "Patient Revenue Operating System",
    url: "https://zenithprosai.com",
    siteName: brandConfig.name,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Zenith Pros - Patient Revenue Operating System" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenith Pros",
    description: "Patient Revenue Operating System",
    images: ["/twitter-image.png"]
  },
  alternates: {
    canonical: "/"
  }
};

export const viewport: Viewport = {
  themeColor: "#0A0F1C",
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DatabaseProvider>
            <BrandProvider>
              <GlobalThemeProvider>
                <AnalyticsProvider />
                {children}
                <LizChatWidget />
                <CookieConsent gaId={env.NEXT_PUBLIC_GA_ID} metaPixelId={env.NEXT_PUBLIC_META_PIXEL_ID} />
              </GlobalThemeProvider>
            </BrandProvider>
          </DatabaseProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
