"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
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
  ClipboardCheck,
  Play
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ZenithLogo } from "@/components/branding/ZenithLogo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { RoiFunnelForm } from "@/components/public/roi-funnel-form";
import { LizExecutiveWidget } from "@/components/public/liz-executive-widget";
import { formatCurrencyForLocale } from "@/lib/currency";
import { normalizeLocale } from "@/lib/i18n/config";
import type { LEGAL_ENTITY } from "@/lib/legal-entity";

type ProsLandingProps = {
  calendlyUrl: string;
  landingStats: {
    assessmentCount: number;
    revenueRecovery: number;
  };
  legalEntity: typeof LEGAL_ENTITY;
};

// ── DATA ──────────────────────────────────────────────────────────────────────

const navItems = [
  ["Assessment", "#assessment"],
  ["Solutions", "#solutions"],
  ["Results", "#results"],
  ["About", "#about"],
  ["Contact", "#contact"]
] as const;

const pulseItems = [
  "+14 recall appointments recovered",
  "$8,900 treatment opportunity identified",
  "93% automation health",
  "12 active patient journeys",
  "127 review requests pending",
  "6 referral opportunities detected",
  "$4,200 recall revenue recovered this week"
];

const clinicalCards = [
  {
    image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=75",
    alt: "Modern high-utilization dental operatory",
    overlay: "High-Utilization Operatory Architecture",
    sub: "Maximize chair time with intelligent scheduling",
    elevated: false
  },
  {
    image: "https://images.unsplash.com/photo-1588776814546-1ffbb172d8e5?auto=format&fit=crop&w=800&q=75",
    alt: "Dental patient care and recall workflow",
    overlay: "Automated Recall Intelligence",
    sub: "Recover overdue patients before they leave for good",
    elevated: true
  },
  {
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=75",
    alt: "Dental treatment consultation and acceptance",
    overlay: "Treatment Acceptance Optimization",
    sub: "Help more patients say yes to diagnosed care",
    elevated: false
  }
] as const;

const revenueMetrics = [
  { label: "Overdue Recall Patients", value: 214, unit: "patients" },
  { label: "Unscheduled Treatment Plans", value: 42, unit: "plans" },
  { label: "Review Opportunities", value: 127, unit: "pending" }
];

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
  { label: "127 overdue hygiene patients identified", opportunity: "$18,400", type: "Recall Recovery" },
  { label: "42 unscheduled treatment plans pending", opportunity: "$31,200", type: "Treatment Acceptance" },
  { label: "Patient retention trending down 8%", opportunity: "−$12,000/yr", type: "Retention Risk" }
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
  { title: "Revenue Recovery", detail: "Identify and recover lost production opportunities across your practice.", icon: TrendingUp },
  { title: "Patient Reactivation", detail: "Bring inactive patients back into your schedule predictably.", icon: Users },
  { title: "Treatment Acceptance", detail: "Help more patients say yes to diagnosed care.", icon: Stethoscope },
  { title: "Recall Recovery", detail: "Rebuild hygiene participation rates and retain patients long-term.", icon: RefreshCw },
  { title: "Review Growth", detail: "Convert satisfied visits into public proof that drives new patient growth.", icon: MessageSquare },
  { title: "Membership Retention", detail: "Reduce plan churn and stabilize recurring membership revenue.", icon: ShieldCheck },
  { title: "Operational Efficiency", detail: "Reduce admin burden and manual outreach without adding staff.", icon: ClipboardCheck },
  { title: "Practice Intelligence", detail: "Know exactly where to focus every week to move the right numbers.", icon: Sparkles }
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

// ── ANIMATION VARIANTS ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

// ── ANIMATED COUNTER ──────────────────────────────────────────────────────────

function AnimatedValue({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>;
}

// ── PULSE TICKER ──────────────────────────────────────────────────────────────

function RevenuePulseTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % pulseItems.length);
        setVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-y border-white/8 bg-[#0A0F1C] py-3.5">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5">
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#14B8A6]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#14B8A6]">Live Practice Intelligence</span>
        </span>
        <div className="h-4 w-px bg-white/10" />
        <p
          className="min-w-0 truncate text-sm font-bold text-white/65 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {pulseItems[idx]}
        </p>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export function ProsLanding({ calendlyUrl, landingStats, legalEntity }: ProsLandingProps) {
  const t = useTranslations("landing");
  const locale = normalizeLocale(useLocale());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryInView = useInView(galleryRef, { once: true, margin: "-10%" });

  const revenueCardRef = useRef<HTMLDivElement>(null);
  const revenueCardInView = useInView(revenueCardRef, { once: true, margin: "-10%" });

  return (
    <main className="min-h-screen bg-[#0A0F1C] text-white">

      {/* ── HEADER ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#0A0F1C]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5">
          <ZenithLogo href="/" subtitle="Dental Revenue Recovery" mutedClassName="text-white/40" textClassName="text-white" />
          <nav className="hidden items-center gap-6 text-xs font-bold text-white/55 xl:flex">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-white">{t(`nav.${label.toLowerCase()}`)}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <LocaleSwitcher currentLocale={locale} compact />
            </div>
            <a
              href="#assessment"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#14B8A6] px-5 text-xs font-black text-[#0A0F1C] transition hover:bg-[#14B8A6]/90"
            >
              {t("primaryCta")} <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(open => !open)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 xl:hidden"
              aria-label="Toggle menu"
            >
              <span className="block h-px w-5 bg-white shadow-[0_5px_0_white,-5px_0_0_white]" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0A0F1C] px-5 pb-6 xl:hidden">
            <nav className="flex flex-col gap-1 pt-4">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  {t(`nav.${label.toLowerCase()}`)}
                </a>
              ))}
            </nav>
            <a
              href="#assessment"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[#14B8A6] text-sm font-black text-[#0A0F1C]"
            >
              {t("primaryCta")}
            </a>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative isolate overflow-hidden pt-[72px]">
        <Image
          src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1800&q=75"
          alt="Modern dental operatory prepared for patient care"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-[0.12]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,15,28,0.6)_0%,#0A0F1C_100%)]" />

        <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl flex-col justify-center px-5 py-20">
          <motion.div
            className="max-w-4xl"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.p variants={fadeUp} className="mb-5 text-[11px] font-black uppercase tracking-[0.2em] text-[#14B8A6]">
              {t("kicker")}
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="text-6xl font-black leading-[1.0] tracking-tight md:text-7xl lg:text-8xl"
            >
              {t("headline")}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-2xl text-xl leading-9 text-white/60 md:text-2xl md:leading-10"
            >
              {t("subtitle")}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-4">
              <a
                href="#assessment"
                className="inline-flex h-14 items-center gap-2.5 rounded-xl bg-[#14B8A6] px-8 text-sm font-black text-[#0A0F1C] shadow-[0_0_32px_rgba(20,184,166,0.25)] transition hover:bg-[#14B8A6]/90 hover:shadow-[0_0_44px_rgba(20,184,166,0.35)]"
              >
                {t("primaryCta")} <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#results"
                className="inline-flex h-14 items-center gap-2.5 rounded-xl border border-white/12 bg-white/6 px-8 text-sm font-black text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <Play className="h-4 w-4 text-[#14B8A6]" />
                {t("demoCta")}
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-6 text-sm font-bold text-white/40">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /> 3-Minute Assessment</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /> Personalized Results</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /> No Obligation</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── PULSE TICKER ── */}
      <RevenuePulseTicker />

      {/* ── CLINICAL INTELLIGENCE GALLERY ── */}
      <section className="py-20" id="results" ref={galleryRef}>
        <div className="mx-auto max-w-7xl px-5">
          <motion.div
            className="mb-14 max-w-2xl"
            variants={stagger}
            initial="hidden"
            animate={galleryInView ? "show" : "hidden"}
          >
            <motion.p variants={fadeUp} className="text-[11px] font-black uppercase tracking-[0.2em] text-[#14B8A6]">
              Clinical Intelligence
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Revenue Intelligence Meets the Clinical Environment
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg leading-8 text-white/50">
              Connect every operatory, every patient journey, every appointment to measurable revenue outcomes.
            </motion.p>
          </motion.div>

          {/* 3-card floating layout — center elevated on desktop */}
          <div className="grid items-end gap-5 md:grid-cols-3">
            {clinicalCards.map((card, i) => (
              <motion.article
                key={card.overlay}
                initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
                animate={galleryInView ? { opacity: 1, y: card.elevated ? -24 : 0, filter: "blur(0px)" } : {}}
                transition={{ duration: 0.65, delay: i * 0.12, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-2xl border border-white/10"
                style={{ height: card.elevated ? "420px" : "360px" }}
              >
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover opacity-75 transition-transform duration-700 group-hover:scale-[1.02]"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="mb-2.5 inline-block rounded-full bg-[#14B8A6]/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#14B8A6]">
                    Intelligence Layer
                  </span>
                  <h3 className="text-lg font-black leading-snug text-white">{card.overlay}</h3>
                  <p className="mt-1.5 text-sm text-white/55">{card.sub}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVENUE OPPORTUNITY CARD ── */}
      <section className="pb-20 pt-4" ref={revenueCardRef}>
        <div className="mx-auto max-w-4xl px-5">
          <motion.div
            initial="hidden"
            animate={revenueCardInView ? "show" : "hidden"}
            variants={fadeIn}
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-10">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-[#14B8A6]/8 blur-3xl" />

              <div className="relative">
                <div className="mb-6 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#14B8A6]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#14B8A6]">Revenue Opportunity Preview</p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Recoverable Annual Revenue</p>
                    <p className="text-5xl font-black text-white md:text-6xl">
                      $<AnimatedValue target={37400} />
                    </p>
                    <p className="mt-2 text-sm text-white/45">Estimated across recall, treatment, and review recovery</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                    {revenueMetrics.map(metric => (
                      <div key={metric.label} className="rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                        <p className="text-xs font-bold text-white/40">{metric.label}</p>
                        <p className="mt-1 text-2xl font-black text-white">
                          <AnimatedValue target={metric.value} />
                        </p>
                        <p className="text-xs text-white/30">{metric.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/8 pt-6">
                  <a
                    href="#assessment"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#14B8A6] px-6 text-sm font-black text-[#0A0F1C] transition hover:bg-[#14B8A6]/90"
                  >
                    View Recovery Plan <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#assessment"
                    className="inline-flex h-11 items-center rounded-lg border border-white/10 bg-white/5 px-6 text-sm font-black text-white transition hover:bg-white/8"
                  >
                    See Full Assessment
                  </a>
                  <p className="ml-auto hidden text-xs text-white/25 md:block">
                    Sample data — personalized estimates from your assessment
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PMS TRUST BAR ── */}
      <section className="border-y border-white/8 bg-white/[0.02] py-8">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Works With Your Practice Software</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-black uppercase tracking-wide text-white/45">
            {["Open Dental", "Dentrix", "Eaglesoft", "Curve Cloud", "Denticon"].map(name => (
              <span key={name} className="rounded-lg border border-white/8 bg-white/4 px-4 py-2">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASSESSMENT ── */}
      <section id="assessment" className="bg-[#F8FAFC] py-20 text-[#0F172A]">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#14B8A6]">Free Practice Growth Assessment</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">{t("assessmentTitle")}</h2>
            <p className="mt-4 text-lg leading-8 text-[#64748B]">
              {t("assessmentBody")}
            </p>
          </div>
          <RoiFunnelForm calendlyUrl={calendlyUrl} />
        </div>
      </section>

      {/* ── REVENUE LEAKS ── */}
      <section id="solutions" className="border-y border-white/8 bg-white/[0.02] py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#14B8A6]">Revenue Leaks</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">Your Practice Is Already Losing Revenue</h2>
            <p className="mt-4 text-lg leading-7 text-white/50">Every dental practice loses revenue through the same predictable gaps. Here is what is slipping through.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {revenueLeaks.map(leak => (
              <article key={leak.title} className="rounded-2xl border border-white/8 bg-white/4 p-6 transition hover:border-white/14 hover:bg-white/6">
                <leak.icon className="h-5 w-5 text-[#14B8A6]" />
                <p className="mt-4 text-2xl font-black text-white">{leak.stat}</p>
                <h3 className="mt-1 font-black text-white">{leak.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">{leak.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIZ SECTION ── */}
      <section id="about" className="bg-[#F8FAFC] py-20 text-[#0F172A]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#14B8A6]">Meet LIZ</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">Your Revenue Recovery Advisor™</h2>
            <p className="mt-5 text-lg leading-8 text-[#64748B]">
              LIZ is not a chatbot. LIZ is your Executive Revenue Intelligence Agent — continuously analyzing practice performance and surfacing the actions most likely to recover revenue, improve retention, and support patient engagement.
            </p>
            <a
              href="#assessment"
              className="mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-[#14B8A6] px-6 text-sm font-black text-[#0A0F1C] transition hover:bg-[#14B8A6]/90"
            >
              Start Free Assessment <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="space-y-4">
            {lizInsights.map(insight => (
              <div key={insight.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#14B8A6]" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#14B8A6]">Opportunity Identified</span>
                    </div>
                    <p className="mt-2 font-black text-[#0F172A]">{insight.label}</p>
                    <p className="text-xs font-bold text-[#64748B]">{insight.type}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-[#64748B]">Estimated opportunity</p>
                    <p className="text-2xl font-black text-[#14B8A6]">{insight.opportunity.replace("$18,400", formatCurrencyForLocale(18400, locale)).replace("$31,200", formatCurrencyForLocale(31200, locale)).replace("$12,000", formatCurrencyForLocale(12000, locale))}</p>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-[#64748B]">Sample practice data for illustration. Your assessment generates personalized estimates.</p>
          </div>
        </div>
      </section>

      {/* ── IMPLEMENTATION TIMELINE ── */}
      <section className="bg-white/[0.02] py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#14B8A6]">Getting Started</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">How Zenith Gets You Results</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
            <div className="space-y-1.5">
              {timelineSteps.map((step, index) => (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${activeStep === index ? "border-[#14B8A6] bg-[#14B8A6]/10 text-white" : "border-white/8 bg-white/[0.03] text-white/45 hover:bg-white/6 hover:text-white/70"}`}
                >
                  <span className="font-bold"><span className="mr-2 font-mono text-[#14B8A6]/55">{step.num}</span>{step.title}</span>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition ${activeStep === index ? "text-[#14B8A6]" : "text-white/20"}`} />
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 p-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#14B8A6]">Step {timelineSteps[activeStep].num}</p>
              <h3 className="mt-3 text-3xl font-black">{timelineSteps[activeStep].title}</h3>
              <p className="mt-4 text-lg leading-8 text-white/55">{timelineSteps[activeStep].detail}</p>
              <div className="mt-8 flex gap-3">
                {activeStep > 0 && (
                  <button type="button" onClick={() => setActiveStep(s => s - 1)} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-white/50 transition hover:bg-white/5">
                    Previous
                  </button>
                )}
                {activeStep < timelineSteps.length - 1 && (
                  <button type="button" onClick={() => setActiveStep(s => s + 1)} className="rounded-lg bg-[#14B8A6] px-4 py-2 text-sm font-bold text-[#0A0F1C] transition hover:bg-[#14B8A6]/90">
                    Next Step
                  </button>
                )}
                {activeStep === timelineSteps.length - 1 && (
                  <a href="#assessment" className="inline-flex items-center gap-2 rounded-lg bg-[#14B8A6] px-4 py-2 text-sm font-bold text-[#0A0F1C]">
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
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#14B8A6]">Results</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">What Practices Gain</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {outcomeCards.map(card => (
              <article key={card.title} className="rounded-2xl border border-white/8 bg-white/4 p-6 transition hover:border-white/14 hover:bg-white/6">
                <card.icon className="h-5 w-5 text-[#14B8A6]" />
                <h3 className="mt-4 font-black text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">{card.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE REPORT ── */}
      <section className="border-y border-white/8 bg-[#F8FAFC] py-20 text-[#0F172A]">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#14B8A6]">Practice Growth Report</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">See What Your Assessment Reveals</h2>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-[0_4px_40px_rgba(15,23,42,0.08)]">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <p className="text-xs font-black uppercase tracking-wider text-[#64748B]">Practice Growth Score</p>
                <p className="mt-2 text-6xl font-black text-[#0F172A]">78 <span className="text-2xl font-bold text-[#64748B]">/ 100</span></p>
              </div>
              <div className="lg:col-span-2">
                <p className="text-xs font-black uppercase tracking-wider text-[#64748B]">Revenue Opportunity</p>
                <p className="mt-2 text-4xl font-black text-[#14B8A6]">
                  {formatCurrencyForLocale(12000, locale)} – {formatCurrencyForLocale(27000, locale)}
                </p>
                <p className="text-sm text-[#64748B]">per month estimated</p>
              </div>
            </div>
            <div className="mt-8 border-t border-[#E2E8F0] pt-6">
              <p className="mb-4 text-xs font-black uppercase tracking-wider text-[#64748B]">Opportunity Breakdown</p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Recall Recovery", pct: 72 },
                  { label: "Treatment Acceptance", pct: 58 },
                  { label: "Review Growth", pct: 44 },
                  { label: "Membership Retention", pct: 68 }
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <p className="text-xs font-bold text-[#64748B]">{item.label}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                      <div className="h-full rounded-full bg-[#14B8A6]" style={{ width: `${item.pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-black text-[#0F172A]">{item.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#assessment"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#14B8A6] px-6 text-sm font-black text-[#0A0F1C]"
              >
                Get Your Free Report <ArrowRight className="h-4 w-4" />
              </a>
              <p className="text-sm font-bold text-[#64748B]">Sample data shown — your report uses real practice numbers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="contact" className="border-t border-white/8 bg-white/[0.02] py-20">
        <div className="mx-auto max-w-3xl px-5">
          <div className="mb-10">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#14B8A6]">FAQ</p>
            <h2 className="mt-4 text-4xl font-black">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <button
                key={faq.question}
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full rounded-2xl border border-white/8 bg-white/4 p-5 text-left transition hover:border-white/14"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="font-black">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-[#14B8A6] transition ${openFaq === index ? "rotate-180" : ""}`} />
                </span>
                {openFaq === index && (
                  <span className="mt-4 block text-sm leading-7 text-white/55">{faq.answer}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.07),transparent)]" />
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
            {t("finalCta")}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-9 text-white/50">
            Receive a complimentary Practice Growth Assessment and uncover hidden opportunities inside your practice.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#assessment"
              className="inline-flex h-14 items-center gap-2.5 rounded-xl bg-[#14B8A6] px-10 text-sm font-black text-[#0A0F1C] shadow-[0_0_40px_rgba(20,184,166,0.18)] transition hover:bg-[#14B8A6]/90 hover:shadow-[0_0_52px_rgba(20,184,166,0.28)]"
            >
              {t("primaryCta")} <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={calendlyUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-14 items-center rounded-xl border border-white/12 bg-white/6 px-10 text-sm font-black text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              {t("bookStrategy")}
            </a>
          </div>
          {landingStats.assessmentCount > 0 && (
            <p className="mt-7 text-sm text-white/30">
              {landingStats.assessmentCount.toLocaleString()} practice{landingStats.assessmentCount !== 1 ? "s" : ""} have completed this assessment.
            </p>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 bg-[#0A0F1C] pb-8 pt-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Company</p>
              <ul className="mt-4 space-y-3">
                {["About", "Case Studies", "Contact"].map(label => (
                  <li key={label}><a href="#" className="text-sm font-semibold text-white/50 transition hover:text-white">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Solutions</p>
              <ul className="mt-4 space-y-3">
                {["Revenue Recovery", "Treatment Acceptance", "Patient Retention", "Recall Recovery"].map(label => (
                  <li key={label}><a href="#solutions" className="text-sm font-semibold text-white/50 transition hover:text-white">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Resources</p>
              <ul className="mt-4 space-y-3">
                {[["Assessment", "#assessment"], ["Growth Report", "#results"], ["FAQs", "#contact"]].map(([label, href]) => (
                  <li key={label}><a href={href} className="text-sm font-semibold text-white/50 transition hover:text-white">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Contact</p>
              <div className="mt-4 space-y-3 text-sm font-semibold text-white/50">
                <p>hello@zenithprosai.com</p>
                <p>Dental Revenue Recovery Platform</p>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center gap-3 border-t border-white/8 pt-8 text-center">
            <p className="font-black text-white">Zenith AI Automation Agency™</p>
            <p className="text-xs text-white/30">Dental Revenue Operating System</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-white/25">
              <Link href="/privacy" className="transition hover:text-white/50">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-white/50">Terms of Service</Link>
              <span>© {legalEntity.currentYear} {legalEntity.legalName}. All Rights Reserved.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── LIZ EXECUTIVE INTELLIGENCE ── */}
      <LizExecutiveWidget />

    </main>
  );
}
