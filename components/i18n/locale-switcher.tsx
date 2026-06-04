"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { localeLabels, localePath, supportedLocales, type SupportedLocale } from "@/lib/i18n/config";

export function LocaleSwitcher({ currentLocale, compact = false }: { currentLocale: SupportedLocale; compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeLocale(locale: SupportedLocale) {
    document.cookie = `zenith_locale=${locale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.push(localePath(pathname, locale)));
  }

  return (
    <label className={compact ? "sr-only" : "flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted"}>
      {!compact ? <span>Language</span> : null}
      <select
        aria-label="Language"
        value={currentLocale}
        disabled={pending}
        onChange={event => changeLocale(event.target.value as SupportedLocale)}
        className="h-10 rounded border border-line bg-white px-3 text-xs font-black text-ink disabled:opacity-60"
      >
        {supportedLocales.map(locale => (
          <option key={locale} value={locale}>
            {localeLabels[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}
