import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

export const metadata: Metadata = {
  title: "Cookie Policy | Zenith Pros",
  description: "Cookie Policy for Zenith Pros services provided by FinClarity Bookkeeping and Services LLC."
};

const sections = [
  {
    title: "1. WHAT COOKIES ARE",
    body: [
      "Cookies are small text files stored by your browser. They help websites remember settings, support security, and measure how visitors use a site."
    ]
  },
  {
    title: "2. COOKIE CATEGORIES",
    body: [
      "Essential cookies are required for core site behavior, security, routing, and consent storage.",
      "Analytics cookies help us understand site usage and improve the product experience.",
      "Marketing cookies help measure campaign and advertising performance."
    ]
  },
  {
    title: "3. HOW ZENITH PROS USES COOKIES",
    body: [
      "Zenith Pros always uses essential cookies necessary to operate the website.",
      "Analytics and marketing cookies are only activated after you provide consent.",
      "Your preferences are stored in the cookie_consent cookie."
    ]
  },
  {
    title: "4. MANAGING PREFERENCES",
    body: [
      "You can accept all optional cookies, use essential cookies only, or save custom preferences from the cookie banner.",
      "You can also clear your browser cookies to reset your preference and show the banner again."
    ]
  },
  {
    title: "5. THIRD-PARTY TOOLS",
    body: [
      "If enabled by consent, Zenith Pros may use analytics or marketing tools such as Google Analytics or Meta Pixel to measure usage and campaign performance.",
      "These tools are not initialized unless the matching consent category has been saved."
    ]
  }
];

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-ink sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded border border-line bg-white p-6 shadow-soft sm:p-10">
        <Link href="/" className="text-sm font-black uppercase tracking-wider text-teal">
          Zenith Pros
        </Link>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">Cookie Policy</h1>
        <p className="mt-2 text-sm font-bold text-muted">Effective Date: January 1, 2026</p>

        <div className="mt-8 space-y-4 text-base leading-7 text-muted">
          <p>
            This Cookie Policy explains how {LEGAL_ENTITY.legalName} uses cookies and similar technologies when you access Zenith Pros websites, software, applications, and related services.
          </p>
          <p>
            For more information about how we collect, use, and protect information, review our{" "}
            <Link href="/privacy" className="font-bold text-teal hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {sections.map(section => (
            <section key={section.title}>
              <h2 className="text-lg font-black text-ink">{section.title}</h2>
              <div className="mt-3 space-y-3 text-base leading-7 text-muted">
                {section.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 border-t border-line pt-8">
          <h2 className="text-lg font-black text-ink">6. CONTACT</h2>
          <div className="mt-3 space-y-2 text-base leading-7 text-muted">
            <p>{LEGAL_ENTITY.legalName}</p>
            <p>
              For privacy-related inquiries:{" "}
              <a className="font-bold text-teal" href="mailto:privacy@zenithprosai.com">
                privacy@zenithprosai.com
              </a>
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
