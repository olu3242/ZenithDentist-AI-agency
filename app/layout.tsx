import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { DatabaseProvider } from "@/components/providers/database-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Zenith AI Automation Agency | Patient Revenue Engine for Dental Practices",
    template: "%s | Zenith AI Automation Agency"
  },
  description:
    "Recover missed revenue, reduce no-shows, automate recall, and turn dental operations into a measurable revenue engine.",
  openGraph: {
    title: "Zenith AI Automation Agency Patient Revenue Engine",
    description:
      "A production-grade operational revenue intelligence platform for dental practices.",
    url: env.NEXT_PUBLIC_SITE_URL,
    siteName: "Zenith AI Automation Agency",
    images: [{ url: "/og", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenith AI Automation Agency Patient Revenue Engine",
    description: "Recover missed revenue and automate dental patient operations."
  },
  alternates: {
    canonical: "/"
  }
};

export const viewport: Viewport = {
  themeColor: "#18212f",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <DatabaseProvider>
          <AnalyticsProvider />
          {children}
        </DatabaseProvider>
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
