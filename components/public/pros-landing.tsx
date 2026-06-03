"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  ClipboardCheck
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ZenithLogo } from "@/components/branding/ZenithLogo";
import { RoiFunnelForm } from "@/components/public/roi-funnel-form";
import type { LEGAL_ENTITY } from "@/lib/legal-entity";

type ProsLandingProps = {
  landingStats: {
    assessmentCount: number;
    revenueRecovery: number;
  };
  legalEntity: typeof LEGAL_ENTITY;
};

const navItems = [
  ["Assessment", "#assessment"],
  ["Solutions", "#solutions"],
  ["Results", "#results"],
  ["About", "#about"],
  ["Case Studies", "#case-studies"],
  ["Contact", "#contact"]
] as const;

const revenueLeaks = [
  { title: "Missed Recalls", stat: "40–60%", detail: "Of hygiene patients fall out of the recall cycle every year.", icon: RefreshCw },
  { title: "Unscheduled Treatment", stat: "$42,000+", detail: "In diagnosed care sits unscheduled in the average practice.", icon: Stethoscope },
  { title: "Inactive Patients", stat: "Lost", detail: "Inactive patients represent the largest single hidden opportunity.", icon: Users },
  { title: "Unanswered Calls", stat: "Missed", detail: "Missed calls convert to missed appointments. Most practices never track this.", icon: Phone },
  { title: "No-Show Leakage", stat: "18–25%", detail: "Of confirmed appointments result in empty chairs.", icon: CalendarCheck },
  { title: "Poor Follow-Up", stat: "60 hrs", detail: "Of front desk time spent on manual outreach that still underperforms.", icon: ClipboardCheck },
  { title: "Review Gaps", stat: "12/mo", detail: "Satisfied patients leave without leaving a review. Growth slows quietly.", icon: MessageSquare }
] satisfies Array<{ title: string; stat: string; detail: string; icon: LucideIcon }>;

const lizInsights = [
  { label: "127 overdue hygiene patients", opportunity: "$18,400", type: "Recall Recovery" },
  { label: "42 unscheduled treatment plans", opportunity: "$31,200", type: "Treatment Acceptance" },
  { label: "Patient retention trending down", opportunity: "−$12,000 / yr", type: "Retention Risk" }
];

const gallerySlides = [
  {
    id: "missed",
    headline: "Missed Opportunities Add Up",
    caption: "Revenue opportunities disappear from your practice every day — silently.",
    image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=900&q=80",
    alt: "Empty dental operatory prepared for patient care",
    type: "image" as const
  },
  {
    id: "patients",
    headline: "Patients Fall Through The Cracks",
    caption: "Inactive patients often represent the largest hidden growth opportunity.",
    image: "https://images.unsplash.com/photo-1588776814546-1ffbb172d8e5?auto=format&fit=crop&w=900&q=80",
    alt: "Dental patient consultation",
    type: "image" as const
  },
  {
    id: "liz",
    headline: "LIZ Identifies What Matters",
    caption: "See exactly where your revenue opportunities exist — prioritized by impact.",
    image: null,
    alt: "",
    type: "liz" as const
  },
  {
    id: "action",
    headline: "Action Creates Growth",
    caption: "Consistent, intelligent follow-up drives better outcomes for patients and practices.",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80",
    alt: "Dental patient care moment",
    type: "image" as const
  },
  {
    id: "results",
    headline: "Predictable, Measurable Growth",
    caption: "Know where to focus next. Every week, every month.",
    image: null,
    alt: "",
    type: "score" as const
  }
];

const timelineSteps = [
  { num: "01", title: "Baseline Diagnostics", detail: "We analyze your current practice performance and identify where revenue is being lost." },
  { num: "02", title: "Organization Setup", detail: "Your account is configured to your practice profile, locations, and team structure." },
  { num: "03", title: "PMS Connection", detail: "We connect securely to your practice management software — Dentrix, Open Dental, Eaglesoft, or others." },
  { num: "04", title: "Data Review", detail: "Your patient and production data is mapped and validated against your revenue baseline." },
  { num: "05", title: "Revenue Baseline", detail: "We establish your starting point and a clear picture of your current opportunity estimate." },
  { num: "06", title: "Playbook Installation", detail: "Recovery workflows are configured for recall, treatment acceptance, and patient reactivation." },
  { num: "07", title: "LIZ Activation", detail: "Your Revenue Recovery Advisor begins monitoring and surfacing prioritized opportunities." },
  { num: "08", title: "Dashboard Go-Live", detail: "Your leadership dashboard becomes your weekly operating view for practice performance." },
  { num: "09", title: "Optimization Cycle", detail: "Monthly review and continuous improvement ensure results compound over time." }
];

const outcomeCards = [
  { title: "Revenue Recovery", detail: "Identify and recover lost production opportunities across your practice." },
  { title: "Patient Reactivation", detail: "Bring inactive patients back into your schedule predictably." },
  { title: "Treatment Acceptance", detail: "Help more patients say yes to diagnosed care." },
  { title: "Recall Recovery", detail: "Rebuild hygiene participation rates and retain patients long-term." },
  { title: "Review Growth", detail: "Convert satisfied visits into public proof that drives new patient growth." },
  { title: "Membership Retention", detail: "Reduce plan churn and stabilize recurring membership revenue." },
  { title: "Operational Efficiency", detail: "Reduce admin burden and manual outreach without adding staff." },
  { title: "Practice Intelligence", detail: "Know exactly where to focus every week to move the right numbers." }
];

const faqs = [
  {
    question: "Does this replace our practice management software?",
    answer: "No. Zenith works alongside your existing PMS — Dentrix, Open Dental, Eaglesoft, and others. There is nothing to replace or migrate. We connect to what you already use."
  },
  {
    question: "How quickly can we get started?",
    answer: "Most practices complete their assessment in under 3 minutes and receive their Practice Growth Report immediately. From there, your implementation team guides you through the rest."
  },
  {
    question: "How is revenue recovery measured?",
    answer: "We establish a clear production baseline at the start, model the recoverable opportunity across recall, treatment acceptance, and patient reactivation, and track improvement month over month so attribution is always transparent."
  }
];

export function ProsLanding({ landingStats, legalEntity }: ProsLandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <main className="min-h-screen bg-[color:var(--brand-sidebar)] text-white">

      {/* ── HEADER ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[color:var(--brand-sidebar)]/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5">
          <ZenithLogo href="/" subtitle="Dental Revenue Recovery" mutedClassName="text-white/50" textClassName="text-white" />
          <nav className="hidden items-center gap-5 text-xs font-bold text-white/62 xl:flex">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-white">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#assessment"
              className="inline-flex h-10 items-center gap-2 rounded bg-teal px-4 text-xs font-black text-[color:var(--brand-sidebar)] transition hover:bg-teal/90"
            >
              Start Free Assessment <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(open => !open)}
              className="flex h-10 w-10 items-center justify-center rounded border border-white/10 xl:hidden"
              aria-label="Toggle menu"
            >
              <span className="block h-[1.5px] w-5 bg-white shadow-[0_6px_0_white,-6px_0_0_white]" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[color:var(--brand-sidebar)] px-5 pb-6 xl:hidden">
            <nav className="flex flex-col gap-1 pt-4">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded px-3 py-3 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  {label}
                </a>
              ))}
            </nav>
            <a
              href="#assessment"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 flex h-12 w-full items-center justify-center rounded bg-teal text-sm font-black text-[color:var(--brand-sidebar)]"
            >
              Start Free Assessment
            </a>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative isolate overflow-hidden pt-[72px]">
        <Image
          src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1800&q=80"
          alt="Modern dental operatory prepared for patient care"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,15,28,0.7),var(--brand-sidebar)_88%)]" />
        <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl flex-col justify-center px-5 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Recover Lost Revenue.<br />
              Fill More Chairs.<br />
              Grow Predictably.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              Zenith helps dental practices uncover hidden revenue opportunities, improve treatment acceptance, recover inactive patients, and increase patient retention.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#assessment"
                className="inline-flex h-12 items-center gap-2 rounded bg-teal px-6 text-sm font-black text-[color:var(--brand-sidebar)] transition hover:bg-teal/90"
              >
                Start Free Assessment <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#results"
                className="inline-flex h-12 items-center rounded border border-white/15 bg-white/8 px-6 text-sm font-black text-white transition hover:bg-white/12"
              >
                See How It Works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm font-bold text-white/55">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal" /> 3-Minute Assessment</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal" /> Personalized Results</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal" /> No Obligation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PMS TRUST BAR ── */}
      <section className="border-y border-white/10 bg-[color:var(--brand-sidebar-elevated)] py-8">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-white/40">Works With Your Practice Software</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm font-black uppercase tracking-wide text-white/55">
            {["Open Dental", "Dentrix", "Eaglesoft", "Curve Cloud", "Denticon"].map(name => (
              <span key={name} className="rounded border border-white/10 bg-white/[0.04] px-4 py-2">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASSESSMENT ── */}
      <section id="assessment" className="bg-background py-16 text-ink">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">Free Practice Growth Assessment</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">Discover Hidden Revenue Opportunities</h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              Complete a short assessment and receive a personalized Practice Growth Report — including your Revenue Opportunity Estimate, Patient Retention Analysis, and LIZ Recommendations.
            </p>
          </div>
          <RoiFunnelForm calendlyUrl="" />
        </div>
      </section>

      {/* ── REVENUE LEAKS ── */}
      <section id="solutions" className="border-y border-white/10 bg-[color:var(--brand-sidebar-elevated)] py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">Revenue Leaks</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">Your Practice Is Already Losing Revenue</h2>
            <p className="mt-4 text-lg leading-7 text-white/60">Every dental practice loses revenue through the same predictable gaps. Here is what is slipping through.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {revenueLeaks.map(leak => (
              <article key={leak.title} className="rounded-xl border border-white/10 bg-[color:var(--brand-sidebar)] p-5">
                <leak.icon className="h-6 w-6 text-teal" />
                <p className="mt-4 text-2xl font-black text-white">{leak.stat}</p>
                <h3 className="mt-1 font-black text-white">{leak.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{leak.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIZ SECTION ── */}
      <section id="about" className="bg-background py-20 text-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">Meet LIZ</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">Your Revenue Recovery Advisor™</h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              LIZ continuously analyzes opportunities across your practice and surfaces the actions most likely to recover revenue, improve retention, and support patient engagement.
            </p>
            <a
              href="#assessment"
              className="mt-8 inline-flex h-12 w-fit items-center gap-2 rounded bg-teal px-6 text-sm font-black text-[color:var(--brand-sidebar)] transition hover:bg-teal/90"
            >
              Start Free Assessment <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="space-y-4">
            {lizInsights.map(insight => (
              <div key={insight.label} className="rounded-xl border border-line bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal" />
                      <span className="text-xs font-black uppercase tracking-wider text-teal">Opportunity Identified</span>
                    </div>
                    <p className="mt-2 font-black text-ink">{insight.label}</p>
                    <p className="text-xs font-bold text-muted">{insight.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-muted">Estimated opportunity</p>
                    <p className="text-2xl font-black text-teal">{insight.opportunity}</p>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted">Sample practice data for illustration. Your assessment generates personalized estimates.</p>
          </div>
        </div>
      </section>

      {/* ── STORY GALLERY ── */}
      <section id="results" className="border-y border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">How It Works</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">A Practice That Grows Without Adding Overhead</h2>
          </div>
          <div className="relative overflow-hidden">
            <div className="flex gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
              {gallerySlides.map((slide, index) => (
                <article
                  key={slide.id}
                  className="relative min-h-[380px] min-w-[320px] flex-shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 md:min-w-[440px]"
                  onClick={() => setActiveSlide(index)}
                >
                  {slide.type === "image" && slide.image ? (
                    <>
                      <Image
                        src={slide.image}
                        alt={slide.alt}
                        fill
                        sizes="440px"
                        className="object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--brand-sidebar)] via-[color:var(--brand-sidebar)]/20 to-transparent" />
                    </>
                  ) : slide.type === "liz" ? (
                    <div className="flex h-full flex-col justify-center bg-[color:var(--brand-sidebar-elevated)] p-8">
                      <div className="space-y-3">
                        {lizInsights.slice(0, 2).map(insight => (
                          <div key={insight.label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-3.5 w-3.5 text-teal" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-teal">Opportunity Identified</span>
                            </div>
                            <p className="text-sm font-bold text-white">{insight.label}</p>
                            <p className="mt-1 text-xl font-black text-teal">{insight.opportunity}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col justify-center bg-[color:var(--brand-sidebar-elevated)] p-8">
                      <p className="text-xs font-black uppercase tracking-widest text-teal">Practice Growth Report</p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                          <p className="text-xs text-white/50">Practice Growth Score</p>
                          <p className="text-4xl font-black text-white">78 <span className="text-xl text-white/40">/ 100</span></p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                          <p className="text-xs text-white/50">Revenue Opportunity</p>
                          <p className="text-2xl font-black text-teal">$12,000 – $27,000</p>
                          <p className="text-xs text-white/40">per month</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-black text-white">{slide.headline}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/65">{slide.caption}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            {gallerySlides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-1.5 rounded-full transition-all ${activeSlide === index ? "w-6 bg-teal" : "w-1.5 bg-white/25"}`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPLEMENTATION TIMELINE ── */}
      <section id="case-studies" className="bg-[color:var(--brand-sidebar-elevated)] py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-12 max-w-2xl">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">Getting Started</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">How Zenith Gets You Results</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
            <div className="space-y-1.5">
              {timelineSteps.map((step, index) => (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${activeStep === index ? "border-teal bg-teal/10 text-white" : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white/80"}`}
                >
                  <span className="font-bold"><span className="mr-2 font-mono text-teal/70">{step.num}</span>{step.title}</span>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition ${activeStep === index ? "text-teal" : "text-white/25"}`} />
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-[color:var(--brand-sidebar)] p-8">
              <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">Step {timelineSteps[activeStep].num}</p>
              <h3 className="mt-3 text-3xl font-black">{timelineSteps[activeStep].title}</h3>
              <p className="mt-4 text-lg leading-8 text-white/65">{timelineSteps[activeStep].detail}</p>
              <div className="mt-8 flex gap-3">
                {activeStep > 0 && (
                  <button type="button" onClick={() => setActiveStep(s => s - 1)} className="rounded border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/5">
                    Previous
                  </button>
                )}
                {activeStep < timelineSteps.length - 1 && (
                  <button type="button" onClick={() => setActiveStep(s => s + 1)} className="rounded bg-teal px-4 py-2 text-sm font-bold text-[color:var(--brand-sidebar)] transition hover:bg-teal/90">
                    Next Step
                  </button>
                )}
                {activeStep === timelineSteps.length - 1 && (
                  <a href="#assessment" className="inline-flex items-center gap-2 rounded bg-teal px-4 py-2 text-sm font-bold text-[color:var(--brand-sidebar)]">
                    Start Your Assessment <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUTCOMES ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">Results</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">What Practices Gain</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {outcomeCards.map(card => (
              <article key={card.title} className="rounded-xl border border-white/10 bg-[color:var(--brand-sidebar-elevated)] p-5">
                <ShieldCheck className="h-5 w-5 text-teal" />
                <h3 className="mt-4 font-black text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{card.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE REPORT ── */}
      <section className="border-y border-white/10 bg-background py-20 text-ink">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">Practice Growth Report</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">See What Your Assessment Reveals</h2>
          </div>
          <div className="rounded-xl border border-line bg-white p-8 shadow-soft">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <p className="text-xs font-black uppercase tracking-wider text-muted">Practice Growth Score</p>
                <p className="mt-2 text-6xl font-black text-ink">78 <span className="text-2xl font-bold text-muted">/ 100</span></p>
              </div>
              <div className="lg:col-span-2">
                <p className="text-xs font-black uppercase tracking-wider text-muted">Revenue Opportunity</p>
                <p className="mt-2 text-4xl font-black text-teal">$12,000 – $27,000</p>
                <p className="text-sm text-muted">per month estimated</p>
              </div>
            </div>
            <div className="mt-8 border-t border-line pt-6">
              <p className="mb-4 text-xs font-black uppercase tracking-wider text-muted">Opportunity Breakdown</p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Recall Recovery", pct: 72 },
                  { label: "Treatment Acceptance", pct: 58 },
                  { label: "Review Growth", pct: 44 },
                  { label: "Membership Retention", pct: 68 }
                ].map(item => (
                  <div key={item.label} className="rounded-lg border border-line bg-surface p-4">
                    <p className="text-xs font-bold text-muted">{item.label}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-teal" style={{ width: `${item.pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-black text-ink">{item.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#assessment"
                className="inline-flex h-11 items-center gap-2 rounded bg-teal px-6 text-sm font-black text-[color:var(--brand-sidebar)]"
              >
                Get Your Free Report <ArrowRight className="h-4 w-4" />
              </a>
              <p className="flex items-center text-sm font-bold text-muted">Sample data shown — your report uses real practice numbers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="contact" className="border-t border-white/10 bg-[color:var(--brand-sidebar-elevated)] py-20">
        <div className="mx-auto max-w-3xl px-5">
          <div className="mb-10">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">FAQ</p>
            <h2 className="mt-4 text-4xl font-black">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <button
                key={faq.question}
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full rounded-xl border border-white/10 bg-[color:var(--brand-sidebar)] p-5 text-left transition hover:border-white/20"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="font-black">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-teal transition ${openFaq === index ? "rotate-180" : ""}`} />
                </span>
                {openFaq === index && (
                  <span className="mt-4 block text-sm leading-7 text-white/65">{faq.answer}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-[color:var(--brand-sidebar)] py-24">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-4xl font-black leading-tight md:text-5xl">Ready To Discover What&apos;s Being Missed?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/60">
            Receive a complimentary Practice Growth Assessment and uncover hidden opportunities inside your practice.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#assessment"
              className="inline-flex h-13 items-center gap-2 rounded bg-teal px-8 text-sm font-black text-[color:var(--brand-sidebar)] transition hover:bg-teal/90"
            >
              Start Free Assessment <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex h-13 items-center rounded border border-white/15 bg-white/8 px-8 text-sm font-black text-white transition hover:bg-white/12"
            >
              Book Strategy Session
            </a>
          </div>
          {landingStats.assessmentCount > 0 && (
            <p className="mt-6 text-sm text-white/40">
              {landingStats.assessmentCount.toLocaleString()} practice{landingStats.assessmentCount !== 1 ? "s" : ""} have completed this assessment.
            </p>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-[color:var(--brand-sidebar)] pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Company</p>
              <ul className="mt-4 space-y-3">
                {["About", "Case Studies", "Contact"].map(label => (
                  <li key={label}><a href="#" className="text-sm font-semibold text-white/60 transition hover:text-white">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Solutions</p>
              <ul className="mt-4 space-y-3">
                {["Revenue Recovery", "Treatment Acceptance", "Patient Retention", "Recall Recovery"].map(label => (
                  <li key={label}><a href="#solutions" className="text-sm font-semibold text-white/60 transition hover:text-white">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Resources</p>
              <ul className="mt-4 space-y-3">
                {[["Assessment", "#assessment"], ["Growth Report", "#sample-report"], ["FAQs", "#contact"]].map(([label, href]) => (
                  <li key={label}><a href={href} className="text-sm font-semibold text-white/60 transition hover:text-white">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Contact</p>
              <div className="mt-4 space-y-3 text-sm font-semibold text-white/60">
                <p>hello@zenith.dental</p>
                <p>Dental Revenue Recovery Platform</p>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center gap-3 border-t border-white/10 pt-8 text-center">
            <p className="font-black text-white">Zenith AI Automation Agency™</p>
            <p className="text-xs text-white/40">Dental Revenue Recovery Platform</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-white/35">
              <Link href="/privacy" className="transition hover:text-white/60">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-white/60">Terms of Service</Link>
              <span>© {legalEntity.currentYear} {legalEntity.legalName}. All Rights Reserved.</span>
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}
