"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, CheckCircle2, FileText, Loader2, LockKeyhole, Sparkles, TrendingUp } from "lucide-react";
import { submitFunnelAction, type FunnelActionState } from "@/app/actions";
import { AuditPreview } from "@/components/public/audit-preview";
import { Button } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics";
import { buildAliceRevenueOpportunityReport, calculateRevenueProjection } from "@/lib/roi";
import { formatCurrency } from "@/lib/utils";
import { funnelSubmissionSchema, type FunnelSubmissionInput } from "@/lib/validation";

const defaults: FunnelSubmissionInput = {
  dentistName: "",
  practiceName: "",
  email: "",
  phone: "",
  locations: 1,
  staffSize: 9,
  pmsSoftware: "Dentrix",
  operationalPain: "No-shows, recall gaps, and unscheduled treatment are creating revenue leakage.",
  source: "free_revenue_opportunity_assessment",
  attribution: {},
  chairs: 4,
  providers: 4,
  monthlyAppointments: 420,
  avgAppointmentValue: 310,
  noShowRate: 18,
  treatmentAcceptanceRate: 54,
  recallRate: 68,
  recallPatientsLost: 60,
  adminHoursPerDay: 5
};

type NumberField = Extract<FieldPath<FunnelSubmissionInput>, "monthlyAppointments" | "avgAppointmentValue" | "noShowRate" | "treatmentAcceptanceRate" | "recallRate" | "providers" | "locations">;

const sliderConfig: Array<{
  name: NumberField;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  prefix?: string;
  detail: string;
}> = [
  { name: "monthlyAppointments", label: "Monthly Appointments", min: 50, max: 2400, step: 10, detail: "Booked, completed, and at-risk visits per month." },
  { name: "avgAppointmentValue", label: "Average Production Per Visit", min: 100, max: 1600, step: 25, prefix: "$", detail: "Average production tied to a kept visit." },
  { name: "noShowRate", label: "No Show Rate", min: 0, max: 45, step: 1, suffix: "%", detail: "Schedule risk that ALICE routes into chair-fill plays." },
  { name: "treatmentAcceptanceRate", label: "Treatment Acceptance Rate", min: 20, max: 95, step: 1, suffix: "%", detail: "Accepted diagnosed care that becomes scheduled production." },
  { name: "recallRate", label: "Recall Rate", min: 25, max: 98, step: 1, suffix: "%", detail: "Active hygiene and recall participation." },
  { name: "providers", label: "Number of Providers", min: 1, max: 24, step: 1, detail: "Clinical capacity available to recover revenue." },
  { name: "locations", label: "Number of Locations", min: 1, max: 40, step: 1, detail: "Practice footprint for Mission Control routing." }
];

export function RoiFunnelForm({ calendlyUrl }: { calendlyUrl: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FunnelActionState | null>(null);
  const [started, setStarted] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [leadGateOpen, setLeadGateOpen] = useState(false);
  const form = useForm<FunnelSubmissionInput>({
    resolver: zodResolver(funnelSubmissionSchema),
    defaultValues: defaults,
    mode: "onChange"
  });

  const values = form.watch();
  const normalizedValues = useMemo(() => {
    const providers = Number(values.providers ?? values.chairs ?? 1);
    const recallRate = Number(values.recallRate ?? 68);
    const monthlyAppointments = Number(values.monthlyAppointments ?? defaults.monthlyAppointments);
    return {
      ...values,
      providers,
      chairs: providers,
      recallPatientsLost: Math.round(monthlyAppointments * Math.max(0, 100 - recallRate) / 100 * 0.45),
      staffSize: Math.max(Number(values.staffSize ?? defaults.staffSize), providers * 3),
      operationalPain: `No-show risk ${values.noShowRate}%, recall rate ${recallRate}%, treatment acceptance ${values.treatmentAcceptanceRate}%.`
    };
  }, [values]);
  const projection = useMemo(() => calculateRevenueProjection(normalizedValues), [normalizedValues]);
  const aliceReport = useMemo(() => buildAliceRevenueOpportunityReport(normalizedValues, projection), [projection, normalizedValues]);
  const submitted = Boolean(result?.ok && result.leadId);
  const showLeadGate = leadGateOpen || interactionCount >= 2 || submitted;

  useEffect(() => {
    form.setValue("chairs", Number(values.providers ?? defaults.providers), { shouldValidate: true });
    form.setValue("recallPatientsLost", normalizedValues.recallPatientsLost, { shouldValidate: true });
    form.setValue("staffSize", normalizedValues.staffSize, { shouldValidate: true });
    form.setValue("operationalPain", normalizedValues.operationalPain, { shouldValidate: true });
  }, [form, normalizedValues.operationalPain, normalizedValues.recallPatientsLost, normalizedValues.staffSize, values.providers]);

  useEffect(() => {
    if (started) return;
    const subscription = form.watch(() => {
      setStarted(true);
      trackClientEvent("roi_started", { source: "interactive_revenue_opportunity_assessment" });
    });
    return () => subscription.unsubscribe();
  }, [form, started]);

  useEffect(() => {
    function onUnload() {
      if (started && !result?.ok) {
        navigator.sendBeacon?.("/api/analytics/abandoned", JSON.stringify({ step: "interactive_revenue_opportunity_assessment" }));
      }
    }
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [started, result]);

  function updateNumber(name: NumberField, nextValue: number) {
    form.setValue(name, nextValue as never, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    if (name === "providers") {
      form.setValue("chairs", nextValue, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
    setInteractionCount(count => Math.min(6, count + 1));
  }

  function submit(input: FunnelSubmissionInput) {
    const payload = {
      ...input,
      ...normalizedValues,
      source: "free_revenue_opportunity_assessment",
      attribution: {
        ...input.attribution,
        landingPath: window.location.pathname,
        search: window.location.search,
        assessmentName: "Interactive Revenue Opportunity Assessment",
        consultingValue: 1500,
        practiceHealthScore: projection.practiceHealthScore,
        reviewOpportunity: projection.reviewOpportunity,
        referralOpportunity: projection.referralOpportunity,
        topLeaks: aliceReport.topRevenueLeaks.map(item => item.label)
      }
    };

    setResult({ ok: true, message: "Generating your FREE Revenue Opportunity Report..." });
    startTransition(async () => {
      trackClientEvent("roi_completed", {
        recoverableRevenue: projection.revenueRecoveryOpportunity,
        assessmentType: "interactive_revenue_opportunity_assessment"
      });
      const response = await submitFunnelAction(payload);
      setResult(response);
      if (response.ok) {
        trackClientEvent("lead_submitted", { leadId: response.leadId, source: "free_revenue_opportunity_assessment" });
        trackClientEvent("audit_requested", { auditId: response.auditId, report: "alice_revenue_opportunity_report" });
      }
    });
  }

  return (
    <section id="roi" className="mx-auto max-w-7xl px-4 py-12 sm:px-5 lg:py-16">
      <form onSubmit={form.handleSubmit(submit)} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="rounded border border-line bg-white p-4 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="brand-kicker">FREE Revenue Opportunity Assessment™</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Live Revenue Opportunity Engine</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-muted sm:text-base">
                Drag the sliders to watch revenue recovery, ALICE recommendations, and Practice Health Score update in real time.
              </p>
            </div>
            <div className="rounded border border-teal/30 bg-teal/10 px-4 py-3 text-center">
              <p className="text-xs font-black uppercase tracking-wider text-teal">$1,500 Consulting Value</p>
              <p className="text-3xl font-black text-ink">FREE</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
            <div className="grid gap-4">
              {sliderConfig.map(config => (
                <SliderControl
                  key={config.name}
                  config={config}
                  value={Number(values[config.name] ?? defaults[config.name] ?? 0)}
                  onChange={updateNumber}
                />
              ))}
            </div>
            <LiveChart projection={projection} />
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: showLeadGate ? 1 : 0.92, y: showLeadGate ? 0 : 6 }}
            className="mt-6 rounded border border-gold/30 bg-gold/10 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gold">Unlock Your FREE Revenue Opportunity Assessment™</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-ink">
                  ALICE has enough signal to generate the executive report, Mission Control lead, and 90-day opportunity snapshot.
                </p>
              </div>
              {!showLeadGate ? (
                <Button type="button" onClick={() => setLeadGateOpen(true)}>
                  <LockKeyhole className="h-4 w-4" />
                  Unlock Report
                </Button>
              ) : null}
            </div>
          </motion.div>

          {showLeadGate ? (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Practice Name" error={form.formState.errors.practiceName?.message}>
                <input {...form.register("practiceName")} className="field" placeholder="Bright Smile Dental" />
              </Field>
              <Field label="Name" error={form.formState.errors.dentistName?.message}>
                <input {...form.register("dentistName")} className="field" placeholder="Dr. Avery Chen" />
              </Field>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <input {...form.register("email")} className="field" type="email" placeholder="owner@practice.com" />
              </Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}>
                <input {...form.register("phone")} className="field" placeholder="(555) 555-0188" />
              </Field>
              <Field label="PMS" error={form.formState.errors.pmsSoftware?.message}>
                <select {...form.register("pmsSoftware")} className="field">
                  <option>Dentrix</option>
                  <option>Open Dental</option>
                  <option>Eaglesoft</option>
                  <option>Curve Cloud</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Locations" error={form.formState.errors.locations?.message}>
                <input
                  className="field"
                  type="number"
                  min={1}
                  max={40}
                  value={Number(values.locations ?? 1)}
                  onChange={event => updateNumber("locations", Number(event.target.value))}
                />
              </Field>
            </motion.div>
          ) : null}

          {result && !submitted ? (
            <p className={`mt-4 rounded p-3 text-sm font-bold ${result.ok ? "bg-green/10 text-green" : "bg-rust/10 text-rust"}`}>
              {result.message}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted">
              <CheckCircle2 className="h-4 w-4 text-green" />
              No calculate button. Results update instantly.
            </div>
            <Button className="sm:min-w-80" disabled={isPending || submitted || !showLeadGate} size="lg">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {submitted ? "Report Generated" : "Get My Free Assessment"}
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <AssessmentPreview submitted={submitted} projection={projection} aliceReport={aliceReport} />
          <AuditPreview
            calendlyUrl={calendlyUrl}
            leadId={result?.leadId}
            reportId={result?.auditId}
            projectedRecovery={result?.projectedRecovery ?? projection.revenueRecoveryOpportunity}
          />
        </div>

        <MobileResultsPanel projection={projection} />
      </form>
    </section>
  );
}

function SliderControl({
  config,
  value,
  onChange
}: {
  config: (typeof sliderConfig)[number];
  value: number;
  onChange: (name: NumberField, value: number) => void;
}) {
  const progress = ((value - config.min) / (config.max - config.min)) * 100;
  return (
    <label className="rounded border border-line bg-surface p-4">
      <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <span>
          <span className="block text-sm font-black text-ink">{config.label}</span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-muted">{config.detail}</span>
        </span>
        <strong className="text-2xl font-black text-teal">
          {config.prefix}{value.toLocaleString()}{config.suffix}
        </strong>
      </span>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={event => onChange(config.name, Number(event.target.value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-teal"
        style={{ background: `linear-gradient(90deg, #0f766e ${progress}%, #dbe3e1 ${progress}%)` }}
      />
    </label>
  );
}

function LiveChart({ projection }: { projection: ReturnType<typeof calculateRevenueProjection> }) {
  const rows = [
    ["Recovery", projection.revenueRecoveryOpportunity],
    ["Recall", projection.recallOpportunity],
    ["Treatment", projection.treatmentOpportunity],
    ["Chair Fill", projection.chairFillOpportunity],
    ["Reviews", projection.reviewOpportunity],
    ["Referrals", projection.referralOpportunity]
  ] as const;
  const max = Math.max(...rows.map(([, value]) => value), 1);

  return (
    <div className="rounded border border-line bg-ink p-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-teal">Live KPI Feed</p>
          <h3 className="mt-2 text-xl font-black">Mission Control Results</h3>
        </div>
        <TrendingUp className="h-6 w-6 text-gold" />
      </div>
      <div className="mt-5 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold">
              <span className="text-white/70">{label}</span>
              <span>{formatCurrency(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-teal"
                initial={false}
                animate={{ width: `${Math.max(4, (value / max) * 100)}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssessmentPreview({
  submitted,
  projection,
  aliceReport
}: {
  submitted: boolean;
  projection: ReturnType<typeof calculateRevenueProjection>;
  aliceReport: ReturnType<typeof buildAliceRevenueOpportunityReport>;
}) {
  return (
    <aside className="sticky top-24 rounded border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="brand-kicker">ALICE Revenue Analysis</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Revenue Opportunity Report</h3>
        </div>
        <Bot className="h-8 w-8 text-teal" />
      </div>
      <div className="mt-5 grid gap-3">
        <PreviewMetric label="Revenue Recovery Opportunity" value={formatCurrency(projection.revenueRecoveryOpportunity)} />
        <PreviewMetric label="Practice Health Score" value={`${projection.practiceHealthScore}/100`} />
        <PreviewMetric label="Recall Opportunity" value={formatCurrency(projection.recallOpportunity)} />
        <PreviewMetric label="Treatment Opportunity" value={formatCurrency(projection.treatmentOpportunity)} />
        <PreviewMetric label="Chair Fill Opportunity" value={formatCurrency(projection.chairFillOpportunity)} />
        <PreviewMetric label="Review Opportunity" value={formatCurrency(projection.reviewOpportunity)} />
        <PreviewMetric label="Referral Opportunity" value={formatCurrency(projection.referralOpportunity)} />
      </div>
      <div className="mt-5 rounded border border-line bg-surface p-4">
        <p className="text-xs font-black uppercase tracking-wider text-muted">Recommended Revenue Playbooks</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {aliceReport.recommendedRevenuePlaybooks.map(item => (
            <span key={item} className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">{item}</span>
          ))}
        </div>
      </div>
      <motion.div
        key={aliceReport.executiveSummary}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 flex items-start gap-2 rounded border border-gold/30 bg-gold/10 p-4"
      >
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-sm font-semibold leading-6 text-ink">
          {submitted ? "Unlocked: " : ""}{aliceReport.executiveSummary}
        </p>
      </motion.div>
    </aside>
  );
}

function MobileResultsPanel({ projection }: { projection: ReturnType<typeof calculateRevenueProjection> }) {
  return (
    <div className="sticky bottom-3 z-20 rounded border border-teal/30 bg-ink p-3 text-white shadow-soft lg:hidden">
      <div className="grid grid-cols-3 gap-2 text-center">
        <CompactMetric label="Recovery" value={formatCurrency(projection.revenueRecoveryOpportunity)} />
        <CompactMetric label="Health" value={`${projection.practiceHealthScore}/100`} />
        <CompactMetric label="Chair Fill" value={formatCurrency(projection.chairFillOpportunity)} />
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-1 block text-sm font-bold text-muted">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-bold text-rust">{error}</span> : null}
    </label>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-line bg-surface px-4 py-3">
      <span className="text-sm font-bold text-muted">{label}</span>
      <strong className="text-right text-sm font-black text-ink">{value}</strong>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] font-black uppercase tracking-wider text-white/60">{label}</span>
      <strong className="block text-xs font-black">{value}</strong>
    </div>
  );
}
