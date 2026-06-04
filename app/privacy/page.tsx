import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

export const metadata: Metadata = {
  title: "Privacy Policy | Zenith Pros",
  description: "Privacy Policy for Zenith Pros services provided by FinClarity Bookkeeping and Services LLC."
};

const sections = [
  {
    title: "1. INFORMATION WE COLLECT",
    intro: "We may collect:",
    items: [
      "Contact information",
      "Business information",
      "Account information",
      "Usage information",
      "Device and browser information",
      "Communications submitted through forms, emails, or support channels"
    ]
  },
  {
    title: "2. HOW WE USE INFORMATION",
    intro: "We may use information to:",
    items: [
      "Provide and improve Services",
      "Respond to inquiries",
      "Process transactions",
      "Communicate with users",
      "Maintain security",
      "Analyze usage trends",
      "Comply with legal obligations"
    ]
  },
  {
    title: "3. COOKIES AND ANALYTICS",
    body: [
      "We use essential cookies to operate the site. Analytics and marketing cookies are only activated after consent. See the Cookie Policy for more detail."
    ]
  },
  {
    title: "4. INFORMATION SHARING",
    body: [
      "We do not sell personal information.",
      "We may share information with service providers, business partners, legal authorities when required by law, or in connection with business operations."
    ]
  },
  {
    title: "5. DATA SECURITY",
    body: [
      "We implement commercially reasonable administrative, technical, and organizational safeguards designed to protect information from unauthorized access, disclosure, alteration, or destruction."
    ]
  },
  {
    title: "6. DATA RETENTION",
    body: [
      "Information may be retained for as long as reasonably necessary to provide Services, comply with legal obligations, resolve disputes, and enforce agreements."
    ]
  },
  {
    title: "7. THIRD-PARTY SERVICES",
    body: [
      "Our Services may integrate with or rely upon third-party providers. Their privacy practices are governed by their respective policies."
    ]
  },
  {
    title: "8. YOUR RIGHTS",
    body: [
      "Subject to applicable law, you may request access to, correction of, or deletion of your information."
    ]
  },
  {
    title: "9. CHANGES TO THIS POLICY",
    body: [
      "We may update this Privacy Policy from time to time. Updated versions will be posted on this website."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-ink sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded border border-line bg-white p-6 shadow-soft sm:p-10">
        <Link href="/" className="text-sm font-black uppercase tracking-wider text-teal">
          Zenith Pros
        </Link>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm font-bold text-muted">Effective Date: January 1, 2026</p>

        <div className="mt-8 space-y-4 text-base leading-7 text-muted">
          <p>
            {LEGAL_ENTITY.legalName} (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your information.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and protect information when you access or use
            Zenith Pros websites, software, applications, and related services.
          </p>
          <p>
            Cookie categories and consent options are described in our{" "}
            <Link href="/cookies" className="font-bold text-teal hover:underline">Cookie Policy</Link>.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {sections.map(section => (
            <section key={section.title}>
              <h2 className="text-lg font-black text-ink">{section.title}</h2>
              <div className="mt-3 space-y-3 text-base leading-7 text-muted">
                {section.intro ? <p>{section.intro}</p> : null}
                {section.body?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                {section.items ? (
                  <ul className="list-disc space-y-2 pl-6">
                    {section.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 border-t border-line pt-8">
          <h2 className="text-lg font-black text-ink">10. CONTACT</h2>
          <div className="mt-3 space-y-2 text-base leading-7 text-muted">
            <p>{LEGAL_ENTITY.legalName}</p>
            <p>
              For privacy-related inquiries:{" "}
              <a className="font-bold text-teal" href="mailto:privacy@zenithprosai.com">
                privacy@zenithprosai.com
              </a>
            </p>
            <p>&copy; 2026 {LEGAL_ENTITY.legalName}. All Rights Reserved.</p>
          </div>
        </section>
      </article>
    </main>
  );
}
