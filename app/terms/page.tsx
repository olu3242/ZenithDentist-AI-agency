import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

export const metadata: Metadata = {
  title: "Terms of Service | Zenith Pros",
  description: "Terms of Service for Zenith Pros services provided by FinClarity Bookkeeping and Services LLC."
};

const sections = [
  {
    title: "1. SERVICES",
    body: [
      "Zenith provides software, automation, communication, reporting, analytics, and operational support tools intended to assist businesses in improving efficiency, customer engagement, and business performance.",
      "The Services may be modified, enhanced, suspended, or discontinued at any time."
    ]
  },
  {
    title: "2. ACCOUNT RESPONSIBILITIES",
    intro: "You are responsible for:",
    items: [
      "Maintaining the confidentiality of account credentials.",
      "Ensuring information provided is accurate and current.",
      "Managing authorized users within your organization.",
      "All activities conducted under your account."
    ]
  },
  {
    title: "3. ACCEPTABLE USE",
    intro: "You agree not to:",
    items: [
      "Violate any applicable law or regulation.",
      "Access systems or data without authorization.",
      "Interfere with the operation or security of the Services.",
      "Upload malicious code or harmful content.",
      "Attempt to reverse engineer or copy the Services."
    ]
  },
  {
    title: "4. SUBSCRIPTIONS AND FEES",
    body: [
      "Certain Services may require payment.",
      "Subscription fees, billing schedules, and renewal terms will be provided separately.",
      "Failure to pay applicable fees may result in suspension or termination of access."
    ]
  },
  {
    title: "5. CUSTOMER DATA",
    body: [
      "You retain ownership of your data.",
      "You grant the Company a limited right to process, store, and use data solely as necessary to provide the Services."
    ]
  },
  {
    title: "6. INTELLECTUAL PROPERTY",
    body: [
      "Customer data remains owned by the customer.",
      "Zenith Pros service materials, software, documentation, reports, templates, and training content are provided under the applicable subscription or services agreement."
    ]
  },
  {
    title: "7. SERVICE MATERIALS",
    body: [
      "The Services may include automation processes, operational frameworks, analytical models, workflows, software systems, and implementation materials.",
      "Customers may not copy, reproduce, disclose, distribute, reverse engineer, or create derivative works from service materials except as allowed in a written agreement."
    ]
  },
  {
    title: "8. DISCLAIMERS",
    body: [
      'The Services are provided on an "AS IS" and "AS AVAILABLE" basis.',
      "The Company does not guarantee specific business outcomes, financial results, revenue increases, customer growth, or operational improvements.",
      "Actual results will vary based on numerous factors outside the Company's control."
    ]
  },
  {
    title: "9. LIMITATION OF LIABILITY",
    body: [
      "To the fullest extent permitted by law, FinClarity Bookkeeping and Services LLC shall not be liable for any indirect, incidental, consequential, special, punitive, or exemplary damages.",
      "The Company's total liability shall not exceed the amount paid by the customer during the twelve (12) months preceding the event giving rise to the claim."
    ]
  },
  {
    title: "10. TERMINATION",
    body: [
      "The Company may suspend or terminate access to the Services at any time for violation of these Terms, nonpayment, security concerns, or misuse of the platform."
    ]
  },
  {
    title: "11. GOVERNING LAW",
    body: [
      "These Terms shall be governed by the laws of the State of Texas.",
      "Any disputes shall be resolved exclusively in the courts located in Bexar County, Texas."
    ]
  }
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-ink sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded border border-line bg-white p-6 shadow-soft sm:p-10">
        <Link href="/" className="text-sm font-black uppercase tracking-wider text-teal">
          Zenith Pros
        </Link>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">Terms of Service</h1>
        <p className="mt-2 text-sm font-bold text-muted">Effective Date: January 1, 2026</p>

        <div className="mt-8 space-y-4 text-base leading-7 text-muted">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the websites, software,
            applications, automation services, communication tools, analytics services, and related offerings
            provided by {LEGAL_ENTITY.legalName} (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) under the Zenith Pros brand (&quot;Services&quot;).
          </p>
          <p>By accessing or using the Services, you agree to be bound by these Terms.</p>
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
          <h2 className="text-lg font-black text-ink">12. CONTACT</h2>
          <div className="mt-3 space-y-2 text-base leading-7 text-muted">
            <p>{LEGAL_ENTITY.legalName}</p>
            <p>
              For legal inquiries, contact:{" "}
              <a className="font-bold text-teal" href="mailto:legal@zenithprosai.com">
                legal@zenithprosai.com
              </a>
            </p>
            <p>&copy; 2026 {LEGAL_ENTITY.legalName}. All Rights Reserved.</p>
          </div>
        </section>
      </article>
    </main>
  );
}
