"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { Check, Cookie, Settings, X } from "lucide-react";
import {
  COOKIE_CONSENT_EVENT,
  defaultCookieConsent,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentPreferences
} from "@/lib/cookie-consent";
import { Button } from "@/components/ui/button";

type OptionalPreference = "analytics" | "marketing";

export function CookieConsent({ gaId, metaPixelId }: { gaId?: string; metaPixelId?: string }) {
  const [preferences, setPreferences] = useState<CookieConsentPreferences | null>(null);
  const [draft, setDraft] = useState<CookieConsentPreferences>(defaultCookieConsent);
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    setPreferences(existing);
    setDraft(existing ?? defaultCookieConsent);
    setShowBanner(!existing);

    function onConsentUpdated(event: Event) {
      const next = (event as CustomEvent<CookieConsentPreferences>).detail;
      setPreferences(next);
      setDraft(next);
      setShowBanner(false);
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentUpdated);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentUpdated);
  }, []);

  function save(next: CookieConsentPreferences) {
    writeCookieConsent(next);
    setPreferences(next);
    setDraft(next);
    setShowBanner(false);
  }

  function toggle(key: OptionalPreference) {
    setDraft(current => ({ ...current, [key]: !current[key] }));
  }

  return (
    <>
      {preferences?.analytics && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      ) : null}
      {preferences?.marketing && metaPixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
      {showBanner ? (
        <section className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-5xl rounded border border-line bg-white p-4 shadow-2xl sm:bottom-5 sm:p-5" aria-label="Cookie consent">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-teal/10 text-teal">
                <Cookie className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-black text-ink">Cookie preferences</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                  Zenith Pros uses essential cookies to run the site. With your consent, we also use analytics to understand usage and marketing cookies to measure campaigns.
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-muted">
                  <span>Essential always on</span>
                  <Link href="/privacy" className="text-teal hover:underline">Privacy Policy</Link>
                  <Link href="/cookies" className="text-teal hover:underline">Cookie Policy</Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Button type="button" onClick={() => save({ essential: true, analytics: true, marketing: true })}>
                <Check className="h-4 w-4" />
                Accept all
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowDetails(current => !current)}>
                <Settings className="h-4 w-4" />
                Preferences
              </Button>
              <Button type="button" variant="ghost" onClick={() => save(defaultCookieConsent)}>
                <X className="h-4 w-4" />
                Essential only
              </Button>
            </div>
          </div>

          {showDetails ? (
            <div className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-3">
              <ConsentOption title="Essential" description="Required for security, routing, and core site behavior." checked disabled />
              <ConsentOption title="Analytics" description="Helps us measure page usage and improve the product experience." checked={draft.analytics} onChange={() => toggle("analytics")} />
              <ConsentOption title="Marketing" description="Helps measure advertising and campaign performance." checked={draft.marketing} onChange={() => toggle("marketing")} />
              <div className="md:col-span-3">
                <Button type="button" onClick={() => save(draft)}>
                  Save preferences
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

function ConsentOption({
  title,
  description,
  checked,
  disabled = false,
  onChange
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
}) {
  return (
    <label className="flex min-h-28 items-start gap-3 rounded border border-line bg-paper p-3 text-sm">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-[color:var(--brand-primary)]" checked={checked} disabled={disabled} onChange={onChange} />
      <span>
        <span className="block font-black text-ink">{title}</span>
        <span className="mt-1 block font-semibold leading-5 text-muted">{description}</span>
      </span>
    </label>
  );
}
