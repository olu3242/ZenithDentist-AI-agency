"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Loader2 } from "lucide-react";
import { submitFunnelAction, type FunnelActionState } from "@/app/actions";
import { AuditPreview } from "@/components/public/audit-preview";
import { Button } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics";
import { calculateRevenueProjection } from "@/lib/roi";
import { formatCurrency } from "@/lib/utils";
import { funnelSubmissionSchema, type FunnelSubmissionInput } from "@/lib/validation";

const defaults: FunnelSubmissionInput = {
  dentistName: "Dr. Avery Chen",
  practiceName: "Bright Smile Dental",
  email: "ops@brightsmile.test",
  phone: "555-0188",
  locations: 1,
  staffSize: 9,
  pmsSoftware: "Dentrix",
  operationalPain: "No-shows and overdue recall patients are creating empty chair time every week.",
  source: "website",
  attribution: {},
  chairs: 6,
  monthlyAppointments: 420,
  avgAppointmentValue: 310,
  noShowRate: 18,
  recallPatientsLost: 32,
  adminHoursPerDay: 5
};

export function RoiFunnelForm({ calendlyUrl }: { calendlyUrl: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FunnelActionState | null>(null);
  const [started, setStarted] = useState(false);
  const form = useForm<FunnelSubmissionInput>({
    resolver: zodResolver(funnelSubmissionSchema),
    defaultValues: defaults,
    mode: "onBlur"
  });

  const values = form.watch();
  const projection = useMemo(() => calculateRevenueProjection(values), [values]);

  useEffect(() => {
    if (started) return;
    const subscription = form.watch(() => {
      setStarted(true);
      trackClientEvent("roi_started", { source: "homepage" });
    });
    return () => subscription.unsubscribe();
  }, [form, started]);

  useEffect(() => {
    function onUnload() {
      if (started && !result?.ok) {
        navigator.sendBeacon?.("/api/analytics/abandoned", JSON.stringify({ step: "roi_form" }));
      }
    }
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [started, result]);

  function submit(input: FunnelSubmissionInput) {
    setResult({ ok: true, message: "Saving audit..." });
    startTransition(async () => {
      trackClientEvent("roi_completed", { recoverableRevenue: projection.recoverableRevenue });
      const response = await submitFunnelAction({
        ...input,
        attribution: {
          landingPath: window.location.pathname,
          search: window.location.search
        }
      });
      setResult(response);
      if (response.ok) {
        trackClientEvent("lead_submitted", { leadId: response.leadId });
        trackClientEvent("audit_requested", { auditId: response.auditId });
      }
    });
  }

  return (
    <section id="roi" className="mx-auto grid max-w-7xl gap-6 px-5 py-16 lg:grid-cols-[1.1fr_.9fr]">
      <form onSubmit={form.handleSubmit(submit)} className="rounded border border-line bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-teal">Revenue intelligence</p>
            <h2 className="mt-3 text-3xl font-black">Calculate leakage and generate an audit.</h2>
            <p className="mt-2 text-muted">Validated inputs, server persistence, email notification, and admin CRM tracking.</p>
          </div>
          <Calculator className="h-9 w-9 text-teal" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Dentist name" error={form.formState.errors.dentistName?.message}>
            <input {...form.register("dentistName")} className="field" />
          </Field>
          <Field label="Practice name" error={form.formState.errors.practiceName?.message}>
            <input {...form.register("practiceName")} className="field" />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <input {...form.register("email")} className="field" type="email" />
          </Field>
          <Field label="Phone" error={form.formState.errors.phone?.message}>
            <input {...form.register("phone")} className="field" />
          </Field>
          <Field label="Locations" error={form.formState.errors.locations?.message}>
            <input {...form.register("locations")} className="field" type="number" />
          </Field>
          <Field label="Staff size" error={form.formState.errors.staffSize?.message}>
            <input {...form.register("staffSize")} className="field" type="number" />
          </Field>
          <Field label="PMS software" error={form.formState.errors.pmsSoftware?.message}>
            <input {...form.register("pmsSoftware")} className="field" />
          </Field>
          <Field label="Chairs" error={form.formState.errors.chairs?.message}>
            <input {...form.register("chairs")} className="field" type="number" />
          </Field>
          <Field label="Monthly appointments" error={form.formState.errors.monthlyAppointments?.message}>
            <input {...form.register("monthlyAppointments")} className="field" type="number" />
          </Field>
          <Field label="Average appointment value" error={form.formState.errors.avgAppointmentValue?.message}>
            <input {...form.register("avgAppointmentValue")} className="field" type="number" />
          </Field>
          <Field label="No-show rate %" error={form.formState.errors.noShowRate?.message}>
            <input {...form.register("noShowRate")} className="field" type="number" />
          </Field>
          <Field label="Recall patients lost / month" error={form.formState.errors.recallPatientsLost?.message}>
            <input {...form.register("recallPatientsLost")} className="field" type="number" />
          </Field>
          <Field label="Admin hours / day" error={form.formState.errors.adminHoursPerDay?.message}>
            <input {...form.register("adminHoursPerDay")} className="field" type="number" />
          </Field>
          <Field label="Operational pain" error={form.formState.errors.operationalPain?.message} className="md:col-span-2">
            <textarea {...form.register("operationalPain")} className="field min-h-24" />
          </Field>
        </div>

        <div className="mt-6 grid gap-3 rounded bg-paper p-4 md:grid-cols-3">
          <Stat label="Monthly leakage" value={formatCurrency(projection.monthlyRevenueLoss)} />
          <Stat label="Yearly leakage" value={formatCurrency(projection.yearlyRevenueLoss)} />
          <Stat label="Recoverable" value={formatCurrency(projection.recoverableRevenue)} />
        </div>

        {result ? (
          <p className={`mt-4 rounded p-3 text-sm font-bold ${result.ok ? "bg-green/10 text-green" : "bg-rust/10 text-rust"}`}>
            {result.message}
          </p>
        ) : null}

        <Button className="mt-6 w-full" disabled={isPending} size="lg">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Generate Audit
        </Button>
      </form>

      <AuditPreview
        calendlyUrl={calendlyUrl}
        leadId={result?.leadId}
        projectedRecovery={result?.projectedRecovery ?? projection.recoverableRevenue}
      />
    </section>
  );
}

function Field({
  label,
  error,
  className,
  children
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-sm font-bold text-muted">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-bold text-rust">{error}</span> : null}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-black uppercase tracking-wider text-muted">{label}</span>
      <strong className="mt-1 block text-2xl font-black text-ink">{value}</strong>
    </div>
  );
}
