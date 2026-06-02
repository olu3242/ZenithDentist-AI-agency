"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  DatabaseZap,
  Gauge,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  Workflow,
  Zap
} from "lucide-react";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import type { LucideIcon } from "lucide-react";
import { ZenithLogo } from "@/components/branding/ZenithLogo";
import { OfflineState } from "@/components/ui/canonical";
import { RoiFunnelForm } from "@/components/public/roi-funnel-form";
import { brandConfig } from "@/lib/brand";

type ProsLandingProps = {
  calendlyUrl: string;
  landingStats: {
    revenueRecovered: number;
    assessments: number;
    practiceHealthScore: number;
    runtimeOperationalScore: number;
    activeAutomations: number;
    runtimeErrorCount: number;
  };
};

type MissionTab = "revenue" | "runtime" | "operations" | "alice" | "executive";
type RoleKey = "frontdesk" | "manager" | "provider" | "owner" | "dso";
type ApiKey = "summary" | "runtime" | "alice" | "integrations";
type GalleryMode = "demo" | "sandbox" | "live";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const navItems = [
  ["Platform", "#platform"],
  ["Screens", "#gallery"],
  ["Leaks", "#leaks"],
  ["Playbooks", "#playbooks"],
  ["Intelligence", "#alice"],
  ["Mission Control", "#mission-control"],
  ["PMS Ops", "#pms-ops"],
  ["Assessment", "#roi"]
] as const;

const revenueLeaks = [
  { title: "No-show leakage", value: "18-25%", detail: "Unconfirmed patients and late cancellations leave production unused.", icon: CalendarCheck },
  { title: "Recall decay", value: "40-60%", detail: "Patients due for hygiene are not consistently recovered.", icon: RefreshCw },
  { title: "Treatment stall", value: "$42K", detail: "Diagnosed care sits unscheduled without structured follow-up.", icon: Stethoscope },
  { title: "Chair gaps", value: "6.4 hrs", detail: "Open operatory time is detected too late to refill.", icon: Gauge },
  { title: "Review drag", value: "12/mo", detail: "Completed visits do not reliably convert into public proof.", icon: MessageSquare },
  { title: "Referral drift", value: "22%", detail: "High-satisfaction patients are not routed into referral loops.", icon: Users },
  { title: "Admin overload", value: "60 hrs", detail: "Manual outreach consumes front desk capacity every month.", icon: ClipboardCheck }
] satisfies Array<{ title: string; value: string; detail: string; icon: LucideIcon }>;

const playbooks = [
  { title: "No Show Prevention", trigger: "48h, 24h, 2h confirmation windows", output: "Protected production and fewer empty chairs", icon: ShieldCheck },
  { title: "Recall Recovery", trigger: "90, 180, 365 day patient cohorts", output: "Recovered hygiene and restorative opportunities", icon: RefreshCw },
  { title: "Chair Fill", trigger: "Open chair inventory and cancellation risk", output: "Backfilled schedule gaps with attributable revenue", icon: CalendarCheck },
  { title: "Treatment Acceptance", trigger: "Unscheduled diagnosed treatment plans", output: "Accepted care follow-up and projected production", icon: TrendingUp },
  { title: "Review Growth", trigger: "Completed appointment and sentiment routing", output: "More reviews without front desk chasing", icon: Sparkles },
  { title: "Referral Growth", trigger: "Promoters, completed care, and household signals", output: "Patient-led growth with measurable influence", icon: Users }
] satisfies Array<{ title: string; trigger: string; output: string; icon: LucideIcon }>;

const missionTabs: Record<MissionTab, { label: string; metric: string; detail: string; rows: string[] }> = {
  revenue: {
    label: "Revenue",
    metric: "$142,850",
    detail: "Recovered, generated, and protected revenue view",
    rows: ["Recall recovery: $18,000 projected", "No-show prevention: $9,800 protected", "Treatment acceptance: $42,500 generated"]
  },
  runtime: {
    label: "Runtime",
    metric: "99.4%",
    detail: "Execution health across active workflows",
    rows: ["Dead letters: 0 active", "Retry queue: 2 monitored", "Workflow completion rate: 96.8%"]
  },
  operations: {
    label: "Ops",
    metric: "91.6%",
    detail: "Automation coverage for practice workflows",
    rows: ["Front desk queue compressed", "Open chair alerts active", "PMS sync checks monitored"]
  },
  alice: {
    label: "Intelligence",
    metric: "14",
    detail: "Current recommendations awaiting review",
    rows: ["Recall cluster at risk", "High-value treatment plan stalled", "Review request route underperforming"]
  },
  executive: {
    label: "Exec",
    metric: "A-",
    detail: "Weekly leadership operating summary",
    rows: ["Practice health: 94/100", "Revenue opportunity score: 88/100", "Expansion readiness: monitored"]
  }
};

const roleWorkspaces: Record<RoleKey, { label: string; title: string; metrics: string[]; queue: string[] }> = {
  frontdesk: {
    label: "Front Desk",
    title: "Front Desk Operations Center Sandbox Preview",
    metrics: ["3 unconfirmed high-risk slots", "4.2 min inbound response target", "91% reminder coverage"],
    queue: ["Confirm 11:00 AM hygiene appointment", "Route cancellation list for Friday openings", "Review platform outreach suggestion"]
  },
  manager: {
    label: "Office Manager",
    title: "Office Manager System Dashboard Sandbox Preview",
    metrics: ["$12,500 daily yield target", "9.2 admin hours saved", "100% sync integrity check"],
    queue: ["Approve high-intent recall batch", "Review schedule utilization", "Validate PMS writeback exceptions"]
  },
  provider: {
    label: "Provider",
    title: "Provider Clinical Tracker Sandbox Preview",
    metrics: ["74.2% acceptance pipeline", "$3,450 daily production", "42 min chair efficiency"],
    queue: ["Review stalled scaling treatment", "Prioritize same-day care opportunity", "Prepare restorative follow-up list"]
  },
  owner: {
    label: "Owner",
    title: "Practice Owner Executive Dashboard Sandbox Preview",
    metrics: ["$142,850 recovered revenue", "96.4 practice health score", "420% audited ROI model"],
    queue: ["Review monthly attribution", "Approve next playbook expansion", "Compare production lift by provider"]
  },
  dso: {
    label: "DSO",
    title: "Enterprise Portfolio Workspace Sandbox Preview",
    metrics: ["12 locations benchmarked", "99.4% isolation score", "+12.4% growth delta"],
    queue: ["Isolate below-target locations", "Review benchmark variance", "Approve multi-practice rollout"]
  }
};

const apiRoutes: Record<ApiKey, { label: string; method: "GET"; path: string }> = {
  summary: { label: "Mission Control Summary", method: "GET", path: "/api/mission-control/operational-summary" },
  runtime: { label: "Runtime Health", method: "GET", path: "/api/mission-control/runtime-health" },
  alice: { label: "Practice Intelligence", method: "GET", path: "/api/alice/recommendations" },
  integrations: { label: "Integration Catalog", method: "GET", path: "/api/enterprise/integrations" }
};

const galleryModes: Record<GalleryMode, { label: string; revenue: string; health: string; status: string }> = {
  demo: { label: "Sandbox Sample", revenue: "$142,850", health: "93 / 100", status: "Sandbox sample adapter" },
  sandbox: { label: "Sandbox", revenue: "$218,400", health: "96 / 100", status: "Sandbox replay active" },
  live: { label: "Live Bus", revenue: "$1,248,500", health: "98 / 100", status: "Production bus view" }
};

const faqs = [
  {
    question: "Is this replacing the dental PMS?",
    answer: "No. PROS is an operating layer around the PMS. It reads operational signals, runs revenue playbooks, and pushes teams toward measurable recovery workflows."
  },
  {
    question: "Can it support a first dental pilot?",
    answer: "The landing page now routes prospects into onboarding, ROI review, playbook education, and product workspaces. Live deployment still depends on the environment and tenant controls being open and verified."
  },
  {
    question: "How is ROI attributed?",
    answer: "Each playbook is modeled through trigger, workflow, execution, runtime trace, attribution record, analytics projection, intelligence insight, and Mission Control update."
  }
];

export function ProsLanding({ calendlyUrl, landingStats }: ProsLandingProps) {
  const [apiOpen, setApiOpen] = useState(false);
  const [apiResponses, setApiResponses] = useState<Record<ApiKey, string>>({
    summary: "{\"status\":\"idle\"}",
    runtime: "{\"status\":\"idle\"}",
    alice: "{\"status\":\"idle\"}",
    integrations: "{\"status\":\"idle\"}"
  });
  const [missionTab, setMissionTab] = useState<MissionTab>("revenue");
  const [role, setRole] = useState<RoleKey>("owner");
  const [pms, setPms] = useState("Open Dental");
  const [galleryMode, setGalleryMode] = useState<GalleryMode>("demo");
  const [hotspotOpen, setHotspotOpen] = useState(false);
  const [installStep, setInstallStep] = useState(1);
  const [monthlyAppointments, setMonthlyAppointments] = useState(720);
  const [visitValue, setVisitValue] = useState(485);
  const [noShowRate, setNoShowRate] = useState(18);
  const [openFaq, setOpenFaq] = useState(0);

  const roi = useMemo(() => {
    const monthlyLeak = monthlyAppointments * visitValue * (noShowRate / 100);
    const recoveredNoShows = monthlyLeak * 0.65;
    const recoveredRecall = monthlyAppointments * visitValue * 0.12 * 0.4;
    const treatmentLift = monthlyAppointments * visitValue * 0.06 * 0.32;
    const annualRecovered = (recoveredNoShows + recoveredRecall + treatmentLift) * 12;
    const annualCost = 18000;
    return {
      monthlyLeak,
      annualRecovered,
      protectedRevenue: recoveredNoShows * 12,
      generatedRevenue: (recoveredRecall + treatmentLift) * 12,
      roi: ((annualRecovered - annualCost) / annualCost) * 100
    };
  }, [monthlyAppointments, noShowRate, visitValue]);

  async function probeRoute(key: ApiKey) {
    const route = apiRoutes[key];
    setApiResponses(current => ({ ...current, [key]: "{\"status\":\"loading\"}" }));
    try {
      const response = await fetch(route.path, { method: route.method, headers: { Accept: "application/json" } });
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json") ? await response.json() : await response.text();
      setApiResponses(current => ({
        ...current,
        [key]: JSON.stringify({ ok: response.ok, status: response.status, payload }, null, 2).slice(0, 1200)
      }));
    } catch (error) {
      setApiResponses(current => ({
        ...current,
        [key]: JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown route probe failure" }, null, 2)
      }));
    }
  }

  const missionBase = missionTabs[missionTab];
  const mission = missionTab === "revenue"
    ? {
        ...missionBase,
        metric: currency.format(landingStats.revenueRecovered),
        rows: [
          `Free assessments routed: ${landingStats.assessments.toLocaleString()}`,
          `Practice health score: ${landingStats.practiceHealthScore ? `${landingStats.practiceHealthScore}/100` : "Pending live assessment"}`,
          `Runtime traces monitored: ${landingStats.activeAutomations.toLocaleString()}`
        ]
      }
    : missionTab === "runtime"
      ? {
          ...missionBase,
          metric: `${landingStats.runtimeOperationalScore}%`,
          rows: [
            `Operational score from runtime module: ${landingStats.runtimeOperationalScore}%`,
            `Failed runtime traces: ${landingStats.runtimeErrorCount.toLocaleString()}`,
            `Active/completed traces: ${landingStats.activeAutomations.toLocaleString()}`
          ]
        }
      : missionBase;
  const workspace = roleWorkspaces[role];
  const gallery = galleryModes[galleryMode];

  return (
    <main className="min-h-screen bg-[color:var(--brand-sidebar)] text-white">
      <OfflineState />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[color:var(--brand-sidebar)]/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5">
          <ZenithLogo href="#platform" subtitle={brandConfig.trademark} mutedClassName="text-white/50" textClassName="text-white" />
          <nav className="hidden items-center gap-5 text-xs font-bold text-white/62 xl:flex">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-white">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setApiOpen(true)}
              className="hidden h-10 items-center gap-2 rounded border border-white/10 bg-white/5 px-3 font-mono text-[10px] font-bold uppercase text-white/70 transition hover:bg-white/10 md:flex"
            >
              <span className="h-2 w-2 rounded-full bg-gold" />
              Route Probe
            </button>
            <a href="#roi" className="inline-flex h-10 items-center rounded bg-teal px-4 text-xs font-black text-[color:var(--brand-sidebar)] transition hover:bg-teal/90">
              Get My Free Assessment
            </a>
          </div>
        </div>
      </header>

      <aside className={`fixed bottom-0 right-0 top-[72px] z-40 w-full max-w-[500px] border-l border-white/10 bg-[color:var(--brand-sidebar-elevated)] p-5 shadow-2xl transition-transform duration-300 ${apiOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-teal">App Route Probe</p>
            <p className="mt-1 text-sm text-white/58">Checks deployed Next.js routes from this browser session.</p>
          </div>
          <button type="button" onClick={() => setApiOpen(false)} className="rounded border border-white/10 px-3 py-1 text-sm text-white/70 hover:bg-white/10">Close</button>
        </div>
        <div className="mt-5 space-y-4 overflow-y-auto pb-8">
          {(Object.keys(apiRoutes) as ApiKey[]).map(key => {
            const route = apiRoutes[key];
            return (
              <div key={key} className="rounded border border-white/10 bg-[color:var(--brand-sidebar)] p-4">
                <div className="flex items-center justify-between gap-3 font-mono text-xs">
                  <span className="font-black text-green">{route.method}</span>
                  <span className="truncate text-white/56">{route.path}</span>
                </div>
                <button type="button" onClick={() => probeRoute(key)} className="mt-3 h-9 w-full rounded bg-white/10 text-xs font-bold text-white transition hover:bg-white/15">
                  Probe {route.label}
                </button>
                <pre className="mt-3 max-h-40 overflow-auto rounded bg-black/30 p-3 text-[10px] leading-relaxed text-teal">{apiResponses[key]}</pre>
              </div>
            );
          })}
        </div>
      </aside>

      <section id="platform" className="relative isolate overflow-hidden pt-[128px]">
        <Image
          src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1800&q=80"
          alt="Modern dental operatory prepared for patient care"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-22"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,15,28,0.72),var(--brand-sidebar)_84%)]" />
        <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl content-center gap-12 px-5 pb-16 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full border border-teal/30 bg-teal/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-teal">
              The Patient Revenue Operating System™
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-normal md:text-7xl">
              Recover lost revenue. Reduce no-shows. Fill chairs. Grow production.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              Zenith PROS turns patient operations into a measurable revenue system: Revenue Playbooks, Practice Intelligence, Mission Control, Workflow OS, and PMS operations in one customer-ready landing experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#roi" className="inline-flex h-12 items-center gap-2 rounded bg-teal px-5 text-sm font-black text-[color:var(--brand-sidebar)] transition hover:bg-teal/90">
                Get My Free Assessment <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#gallery" className="inline-flex h-12 items-center rounded border border-white/15 bg-white/8 px-5 text-sm font-black text-white transition hover:bg-white/12">
                Watch Demo
              </a>
            </div>
          </div>

          <div className="rounded border border-white/10 bg-[color:var(--brand-sidebar-elevated)]/88 p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/52">
                <span className="h-2 w-2 rounded-full bg-green" />
                Mission Control Preview
              </div>
              <span className="rounded border border-gold/30 bg-gold/10 px-2 py-1 font-mono text-[10px] uppercase text-gold">Backend summary snapshot</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Revenue Opportunity", currency.format(landingStats.revenueRecovered), "text-teal"],
                ["Free Assessments", landingStats.assessments.toLocaleString(), "text-gold"],
                ["Runtime Score", `${landingStats.runtimeOperationalScore}%`, "text-blue"],
                ["Practice Health", landingStats.practiceHealthScore ? `${landingStats.practiceHealthScore}/100` : "Pending", "text-green"]
              ].map(([label, value, color]) => (
                <div key={label} className="rounded border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/45">{label}</p>
                  <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded border border-teal/20 bg-black/20 p-4 font-mono text-xs leading-6 text-white/62">
              <p className="text-teal">Intelligence diagnostic queue</p>
              <p>Assessments routed: {landingStats.assessments.toLocaleString()}</p>
              <p>Runtime traces monitored: {landingStats.activeAutomations.toLocaleString()} active/completed, {landingStats.runtimeErrorCount.toLocaleString()} failed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[color:var(--brand-sidebar-elevated)] py-10">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-center font-mono text-xs font-bold uppercase tracking-widest text-white/45">Dental revenue operations ecosystem</p>
          <div className="mt-7 grid grid-cols-2 gap-3 text-center text-sm font-black uppercase tracking-wide text-white/62 md:grid-cols-6">
            {["Open Dental", "Dentrix", "Eaglesoft", "Curve", "DSO Ops"].map(item => (
              <div key={item} className="rounded border border-white/10 bg-white/[0.03] px-3 py-4">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Integrated Gallery Workspace" title="Screens, clinical spaces, and intelligence actions in one operating story." body="The gallery now mirrors the uploaded workspace: product frames, PMS mapping, operatory hotspot scanning, and action-oriented intelligence cards." />
          <div className="flex w-full max-w-md items-center gap-1 rounded border border-white/10 bg-[color:var(--brand-sidebar-elevated)] p-1 font-mono text-xs">
            {(Object.keys(galleryModes) as GalleryMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setGalleryMode(mode)}
                className={`flex-1 rounded px-3 py-2 font-bold uppercase transition ${galleryMode === mode ? "bg-[color:var(--brand-slate)] text-white" : "text-white/52 hover:text-white"}`}
              >
                {galleryModes[mode].label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="flex min-h-[480px] flex-col justify-between rounded border border-white/10 bg-[color:var(--brand-sidebar-elevated)] p-5">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/52">
                <span className="h-2 w-2 rounded-full bg-green" />
                Sys Screen: Mission Control Command
              </div>
              <span className="rounded border border-teal/25 bg-teal/10 px-2 py-1 font-mono text-[9px] font-bold uppercase text-teal">Revenue active</span>
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-between rounded border border-white/10 bg-[color:var(--brand-sidebar)] p-5 font-mono">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded border border-white/10 bg-white/[0.04] p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-white/42">Total Revenue Recovered</span>
                  <span className="mt-2 block text-3xl font-black text-teal">{gallery.revenue}</span>
                </div>
                <div className="rounded border border-white/10 bg-white/[0.04] p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-white/42">Executive Operating Score</span>
                  <span className="mt-2 block text-3xl font-black text-white">{gallery.health}</span>
                </div>
              </div>
              <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-white/62">
                <p className="text-[10px] uppercase tracking-widest text-white/42">Active Dispatch Log</p>
                <div className="flex justify-between rounded border border-white/10 bg-white/[0.04] p-3">
                  <span>Recall cohort recovery loop</span>
                  <span className="text-green">DISPATCHED</span>
                </div>
                <div className="flex justify-between rounded border border-white/10 bg-white/[0.04] p-3">
                  <span>Crown gap matching playbook</span>
                  <span className="text-teal">COMPLETED</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/56">
              <span>{gallery.status}</span>
              <button type="button" onClick={() => setGalleryMode("sandbox")} className="rounded border border-white/10 bg-[color:var(--brand-slate)] px-4 py-2 font-mono text-[11px] font-bold text-blue transition hover:bg-[color:var(--brand-slate-hover)]">
                Simulate Dispatch
              </button>
            </div>
          </article>

          <article className="flex min-h-[480px] flex-col justify-between rounded border border-white/10 bg-[color:var(--brand-sidebar-elevated)] p-5">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/52">
                <span className="h-2 w-2 rounded-full bg-blue" />
                Sys Screen: PMS Integration Translator
              </div>
              <span className="rounded border border-blue/25 bg-blue/10 px-2 py-1 font-mono text-[9px] font-bold uppercase text-blue">Schema compiler</span>
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-between rounded border border-white/10 bg-[color:var(--brand-sidebar)] p-5 font-mono text-xs">
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-white/42">Local adapter database field configuration</p>
                {[
                  ["txt_pat_id", "patient_id (UUID)"],
                  ["dt_last_visit", "last_hygiene_date"],
                  ["fl_unsched_amt", "outstanding_balance"]
                ].map(([from, to]) => (
                  <div key={from} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-white/[0.04] p-3">
                    <span className="font-bold text-white">{from}</span>
                    <span className="font-black text-blue">=====</span>
                    <span className="text-teal">{to}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded border border-white/10 bg-black/20 p-4 text-[10px] leading-6 text-white/48">
                <p className="font-bold text-green">Adapter state: schema validation integrity ready</p>
                <p>Thread safety parameter locks queued for writeback validation.</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/56">
              <span>Backend sync: integrations / PMS adapter</span>
              <span className="rounded border border-teal/20 bg-teal/10 px-2.5 py-1 font-mono text-[11px] text-teal">Writeback verified</span>
            </div>
          </article>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <article className="relative min-h-[420px] overflow-hidden rounded border border-white/10 bg-[color:var(--brand-slate)] shadow-2xl lg:col-span-7">
            <Image
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80"
              alt="Dental operatory with clinical equipment"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--brand-sidebar)] via-transparent to-transparent" />
            <button
              type="button"
              onClick={() => setHotspotOpen(true)}
              className="absolute left-[60%] top-[40%] z-20"
              aria-label="Inspect operatory hotspot"
            >
              <span className="absolute -left-3 -top-3 h-9 w-9 animate-ping rounded-full bg-blue/30" />
              <span className="block h-4 w-4 rounded-full border-2 border-white bg-blue" />
            </button>
            <div className="absolute bottom-6 left-6 z-10">
              <span className="rounded border border-teal/20 bg-teal/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-teal">Hygienist area</span>
              <h3 className="mt-2 text-xl font-black">Operatory Room 4</h3>
            </div>
          </article>

          <article className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded border border-white/10 bg-[color:var(--brand-slate)] p-6 lg:col-span-5">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4 font-mono text-[10px] uppercase tracking-widest text-white/52">
                <span className="h-2 w-2 rounded-full bg-blue" />
                Hotspot telemetry diagnostics
              </div>
              <div className="mt-5 space-y-4 text-sm leading-7 text-white/64">
                {hotspotOpen ? (
                  <>
                    <h3 className="text-2xl font-black text-white">Chair Monitor Interface Setup</h3>
                    <p>Visual indicators surface outstanding treatment plans directly to clinicians as patients move through Room 4.</p>
                    <div className="rounded border border-teal/20 bg-[color:var(--brand-sidebar)] p-3 font-mono text-xs text-teal">Mapping node: txt_pat_id ===== patient_id (UUID)</div>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-black text-white">Click the operatory signal</h3>
                    <p>Scan checks reveal how the Patient Revenue Operating System connects software prompts to physical clinic workflows.</p>
                  </>
                )}
              </div>
            </div>
            <p className="relative border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-widest text-white/42">Workspace diagnostics pool: connected</p>
          </article>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {[
            ["43 overdue hygiene recalls", "$18,250", "Recall recovery playbook", "text-teal", "bg-teal"],
            ["Friday vacancy forecast", "High risk", "Chair fill protection", "text-blue", "bg-blue"],
            ["Unsubmitted claims audit", "+$12,450", "Revenue operations cleanup", "text-green", "bg-green"]
          ].map(([title, metric, detail, tone, bar]) => (
            <article key={title} className="relative overflow-hidden rounded border border-white/10 bg-[color:var(--brand-slate)] p-5">
              <div className={`absolute left-0 top-0 h-1 w-full ${bar}`} />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`font-mono text-xs font-black uppercase tracking-widest ${tone}`}>{detail}</p>
                  <h3 className="mt-4 text-xl font-black">{title}</h3>
                </div>
                <Bot className={`h-7 w-7 ${tone}`} />
              </div>
              <p className="mt-5 font-mono text-2xl font-black text-white">{metric}</p>
              <button type="button" className="mt-5 rounded border border-white/10 bg-[color:var(--brand-sidebar)] px-3 py-2 text-xs font-black text-white/70">
                Queue action
              </button>
            </article>
          ))}
        </div>
      </section>

      <section id="leaks" className="border-y border-white/10 bg-[color:var(--brand-sidebar-elevated)] py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeading eyebrow="Seven Revenue Leaks" title="The buying problem is concrete: revenue is leaking through daily operations." body="Each leak maps to a measurable workflow, attribution path, and executive reporting outcome." />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {revenueLeaks.map(item => (
              <article key={item.title} className="rounded border border-white/10 bg-[color:var(--brand-sidebar)] p-5">
                <item.icon className="h-7 w-7 text-gold" />
                <p className="mt-5 text-3xl font-black text-white">{item.value}</p>
                <h3 className="mt-2 text-lg font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/56">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="playbooks" className="mx-auto max-w-7xl px-5 py-20">
        <SectionHeading eyebrow="Revenue Playbooks" title="Install playbooks that create workflows, triggers, attribution, and monitoring." body="The landing page explains the operational path from problem to measurable revenue outcome without adding a new platform layer." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playbooks.map(item => (
            <article key={item.title} className="rounded border border-white/10 bg-[color:var(--brand-sidebar-elevated)] p-5">
              <item.icon className="h-8 w-8 text-teal" />
              <h3 className="mt-5 text-xl font-black">{item.title}</h3>
              <p className="mt-3 text-sm text-white/52">{item.trigger}</p>
              <p className="mt-4 rounded border border-green/20 bg-green/10 p-3 text-sm font-bold text-green">{item.output}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="alice" className="border-y border-white/10 bg-background py-20 text-ink">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-widest text-blue">Practice Intelligence</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">A dental revenue advisor that speaks in actions, not dashboards.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              The platform summarizes daily performance, identifies revenue opportunities, detects automation risk, and recommends the next operational move for each role.
            </p>
          </div>
          <div className="rounded border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <Bot className="h-8 w-8 text-blue" />
              <div>
                <h3 className="font-black">Daily Performance Summary</h3>
                <p className="text-sm text-muted">Generated from backend runtime and analytics modules; sandbox copy is labeled where live data is unavailable.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Recall recovery is the highest revenue opportunity today.",
                "Treatment acceptance follow-up is under target for two providers.",
                "No-show prevention and chair fill recommendations are routed through the platform when live signals are available.",
                "Mission Control should watch integration writeback latency before go-live."
              ].map(item => (
                <div key={item} className="flex gap-3 rounded border border-line bg-surface p-3 text-sm text-foreground">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="mission-control" className="mx-auto max-w-7xl px-5 py-20">
        <SectionHeading eyebrow="Mission Control" title="One command surface for revenue, runtime, operations, intelligence, and executive reporting." body="The tabbed preview gives buyers a fast sense of what internal teams and practice leaders will monitor after go-live." />
        <div className="rounded border border-white/10 bg-[color:var(--brand-sidebar-elevated)] p-5">
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {(Object.keys(missionTabs) as MissionTab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setMissionTab(tab)}
                className={`rounded px-4 py-2 text-xs font-black uppercase tracking-wide transition ${missionTab === tab ? "bg-teal text-[color:var(--brand-sidebar)]" : "bg-white/5 text-white/62 hover:bg-white/10"}`}
              >
                {missionTabs[tab].label}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="rounded border border-white/10 bg-[color:var(--brand-sidebar)] p-5">
              <p className="font-mono text-xs uppercase tracking-widest text-white/45">{mission.detail}</p>
              <p className="mt-5 text-6xl font-black text-teal">{mission.metric}</p>
            </div>
            <div className="space-y-3">
              {mission.rows.map(row => (
                <div key={row} className="flex items-start gap-3 rounded border border-white/10 bg-white/[0.04] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green" />
                  <span className="text-white/72">{row}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pms-ops" className="border-y border-white/10 bg-[color:var(--brand-sidebar-elevated)] py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="PMS Operations" title="Connection readiness without claiming what production has not proven." body="The page presents connector operations, sync posture, and rollback-minded deployment steps while route access and tenant safety remain verifiable." />
            <select value={pms} onChange={event => setPms(event.target.value)} className="mt-4 h-12 w-full max-w-md rounded border border-white/10 bg-[color:var(--brand-sidebar)] px-4 text-white">
              <option>Open Dental</option>
              <option>Dentrix Enterprise</option>
              <option>Eaglesoft</option>
              <option>Curve Cloud</option>
            </select>
          </div>
          <div className="rounded border border-white/10 bg-[color:var(--brand-sidebar)] p-5 font-mono text-xs leading-7 text-white/62">
            <p className="text-teal">[{pms}] connector profile selected</p>
            <p>INF sync health check queued</p>
            <p>INF tenant-scoped writeback verification required</p>
            <p className="text-gold">WRN production PMS claims require live credential validation</p>
            <p className="text-green">OK landing experience can route assessment and onboarding demand</p>
          </div>
        </div>
      </section>

      <section id="role-workspaces" className="mx-auto max-w-7xl px-5 py-20">
        <SectionHeading eyebrow="Role Workspaces" title="Every stakeholder sees the operating work that belongs to them." body="Front desk, managers, providers, owners, and DSOs get different action queues while sharing the same revenue truth." />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(roleWorkspaces) as RoleKey[]).map(key => (
            <button key={key} type="button" onClick={() => setRole(key)} className={`rounded px-4 py-2 text-sm font-black transition ${role === key ? "bg-gold text-[color:var(--brand-sidebar)]" : "bg-white/8 text-white/66 hover:bg-white/12"}`}>
              {roleWorkspaces[key].label}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded border border-white/10 bg-[color:var(--brand-sidebar-elevated)] p-5">
          <h3 className="text-2xl font-black">{workspace.title}</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workspace.metrics.map(metric => (
              <div key={metric} className="rounded border border-white/10 bg-[color:var(--brand-sidebar)] p-4 font-bold text-white/78">{metric}</div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {workspace.queue.map(item => (
              <div key={item} className="flex gap-3 rounded border border-white/10 bg-white/[0.04] p-4 text-white/68">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roi-engine" className="border-y border-white/10 bg-background py-20 text-ink">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-widest text-blue">FREE Revenue Opportunity Assessment™</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">Unlock a $1,500 revenue diagnostic before the sales call.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              Model recoverable revenue, generated revenue, protected revenue, Practice Health Score, and playbook recommendations. $1,500 Consulting Value — FREE.
            </p>
          </div>
          <div className="rounded border border-line bg-white p-5 shadow-soft">
            <RoiSlider label="Monthly appointments" value={monthlyAppointments} min={120} max={1600} step={20} onChange={setMonthlyAppointments} suffix="" />
            <RoiSlider label="Average visit value" value={visitValue} min={150} max={1200} step={25} onChange={setVisitValue} prefix="$" />
            <RoiSlider label="No-show rate" value={noShowRate} min={4} max={35} step={1} onChange={setNoShowRate} suffix="%" />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <RoiOutput label="Annual recovered revenue" value={currency.format(roi.annualRecovered)} tone="text-teal" />
              <RoiOutput label="Attributable ROI" value={`${roi.roi.toFixed(1)}%`} tone="text-blue" />
              <RoiOutput label="Protected revenue" value={currency.format(roi.protectedRevenue)} tone="text-green" />
              <RoiOutput label="Generated revenue" value={currency.format(roi.generatedRevenue)} tone="text-gold" />
            </div>
          </div>
        </div>
      </section>

      <RoiFunnelForm calendlyUrl={calendlyUrl} />

      <section id="deployment" className="mx-auto max-w-7xl px-5 py-20">
        <SectionHeading eyebrow="Installation" title="A 9-step path from assessment to optimization." body="The updated landing page supports the operational sales motion: assessment, provisioning, PMS handshake, data mapping, playbook installation, intelligence activation, Mission Control, and optimization." />
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-2">
            {[
              "Baseline Diagnostics",
              "Organization Provisioning",
              "PMS Connection",
              "Data Mapping",
              "Revenue Baseline",
              "Playbook Installation",
              "Intelligence Activation",
              "Mission Control Go-Live",
              "Optimization Cycle"
            ].map((step, index) => (
              <button key={step} type="button" onClick={() => setInstallStep(index + 1)} className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left text-sm font-bold transition ${installStep === index + 1 ? "border-teal bg-teal/10 text-white" : "border-white/10 bg-white/[0.03] text-white/58 hover:bg-white/[0.06]"}`}>
                <span>{String(index + 1).padStart(2, "0")} {step}</span>
                <span className={`h-2 w-2 rounded-full ${installStep === index + 1 ? "bg-teal" : "bg-white/20"}`} />
              </button>
            ))}
          </div>
          <div className="rounded border border-white/10 bg-[color:var(--brand-sidebar-elevated)] p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Step {installStep}</p>
            <h3 className="mt-3 text-3xl font-black">Deployment readiness checkpoint</h3>
            <p className="mt-4 text-white/62">
              This phase validates scope, tenant safety, data readiness, playbook ownership, and success criteria before a live dental practice uses the system.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {["Owner assigned", "Evidence captured", "Rollback path known"].map(item => (
                <div key={item} className="rounded border border-white/10 bg-[color:var(--brand-sidebar)] p-4 text-sm font-bold text-white/72">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-white/10 bg-[color:var(--brand-sidebar-elevated)] py-20">
        <div className="mx-auto max-w-4xl px-5">
          <SectionHeading eyebrow="FAQ" title="Answers for buyers and pilot practices." body="" />
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <button key={faq.question} type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="w-full rounded border border-white/10 bg-[color:var(--brand-sidebar)] p-5 text-left">
                <span className="flex items-center justify-between gap-4">
                  <span className="font-black">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-teal transition ${openFaq === index ? "rotate-180" : ""}`} />
                </span>
                {openFaq === index && <span className="mt-4 block leading-7 text-white/62">{faq.answer}</span>}
              </button>
            ))}
          </div>
          <div className="mt-10 rounded border border-teal/25 bg-teal/10 p-6 text-center">
            <h2 className="text-3xl font-black">Ready to install the Patient Revenue Operating System?</h2>
            <p className="mt-3 text-white/64">Start with a revenue assessment, then move into onboarding and pilot activation.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="#roi" className="inline-flex h-12 items-center rounded bg-teal px-5 text-sm font-black text-[color:var(--brand-sidebar)]">Get My Free Assessment</a>
              <a href="#gallery" className="inline-flex h-12 items-center rounded border border-white/15 px-5 text-sm font-black text-white">Watch Demo</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[color:var(--brand-sidebar)] px-5 py-8 text-center text-sm font-semibold text-white/58">
        <p className="font-black text-white">Zenith AI Automation Agency™</p>
        <p className="mt-2">A product and service of {LEGAL_ENTITY.legalName}.</p>
        <p className="mt-2">© {LEGAL_ENTITY.currentYear} {LEGAL_ENTITY.legalName}. All Rights Reserved.</p>
      </footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="font-mono text-xs font-black uppercase tracking-widest text-teal">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-black leading-tight text-current md:text-5xl">{title}</h2>
      {body ? <p className="mt-5 text-lg leading-8 text-white/60 [.text-ink_&]:text-muted">{body}</p> : null}
    </div>
  );
}

function RoiSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  prefix = "",
  suffix = ""
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="block border-b border-line py-4 last:border-b-0">
      <span className="flex items-center justify-between gap-4 text-sm font-black">
        <span>{label}</span>
        <span className="font-mono text-blue">{prefix}{value.toLocaleString()}{suffix}</span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={event => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-teal"
      />
    </label>
  );
}

function RoiOutput({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded border border-line bg-surface p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p>
    </div>
  );
}
