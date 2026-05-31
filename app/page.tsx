import Image from "next/image";
import { ArrowRight, BarChart3, ShieldCheck, Workflow } from "lucide-react";
import { SiteHeader } from "@/components/public/site-header";
import { RoiFunnelForm } from "@/components/public/roi-funnel-form";
import { FAQ } from "@/components/public/faq";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zenith AI Automation Agency",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Operational revenue intelligence system for dental practices."
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden bg-surface text-white">
          <Image
            src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1800&q=80"
            alt="Modern dental operatory prepared for patient care"
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover opacity-36"
          />
          <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl content-center gap-10 px-5 py-20 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-accent">Production revenue operations for dental practices</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">
                Recover missed revenue before empty chairs become normal.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
                Zenith AI Automation Agency turns no-show risk, recall gaps, audit requests, bookings, and lead operations into a measurable Patient Revenue Engine for dental practices.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg"><a href="#roi">Run Revenue Audit <ArrowRight className="h-4 w-4" /></a></Button>
                <Button asChild variant="secondary" size="lg"><a href="/admin">Open Admin CRM</a></Button>
              </div>
            </div>
            <div className="grid gap-4 self-end">
              <MetricCard label="Target no-show reduction" value="40%" detail="Reminder and recovery stack" tone="accent" />
              <MetricCard label="CRM-ready funnel" value="6" detail="Persisted operational tables" tone="warning" />
              <MetricCard label="Deployment target" value="90+" detail="Lighthouse performance architecture" tone="success" />
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-5 py-14 md:grid-cols-3">
          {[
            { icon: BarChart3, title: "Revenue Intelligence", body: "ROI calculations are validated, persisted, and tied to lead records for CRM follow-up." },
            { icon: Workflow, title: "Operational CRM", body: "Admin routes expose leads, audits, bookings, funnel events, and source attribution." },
            { icon: ShieldCheck, title: "Production Scaffold", body: "Typed env validation, Supabase service access, RLS policies, structured logs, and error boundaries." }
          ].map(item => (
            <article key={item.title} className="rounded border border-card bg-white p-6">
              <item.icon className="h-8 w-8 text-accent" />
              <h2 className="mt-5 text-xl font-black">{item.title}</h2>
              <p className="mt-3 text-muted">{item.body}</p>
            </article>
          ))}
        </section>

        <RoiFunnelForm calendlyUrl={env.CALENDLY_URL} />
        <FAQ />
      </main>
    </>
  );
}
