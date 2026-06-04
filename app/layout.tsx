import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
    title: "ZENITH PROS™",
    description: "Patient Revenue Operating System™",
    url: "https://zenithprosai.com",
    siteName: brandConfig.name,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "ZENITH PROS - Patient Revenue Operating System" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ZENITH PROS™",
    description: "Patient Revenue Operating System™",
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
              </GlobalThemeProvider>
            </BrandProvider>
          </DatabaseProvider>
        </NextIntlClientProvider>
        {env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        ) : null}
        {env.NEXT_PUBLIC_META_PIXEL_ID ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${env.NEXT_PUBLIC_META_PIXEL_ID}');fbq('track','PageView');`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
