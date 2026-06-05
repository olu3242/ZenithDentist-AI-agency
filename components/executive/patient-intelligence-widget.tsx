import { PatientSegmentDonut, RecallFunnel, TreatmentAcceptanceFunnel } from "@/components/charts";
import { patientSegmentData, recallFunnelData, treatmentFunnelData } from "@/components/executive/sample-data";

export function PatientIntelligenceWidget() {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-gold">Patient Intelligence</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <PatientSegmentDonut data={patientSegmentData} />
        <RecallFunnel data={recallFunnelData} />
        <TreatmentAcceptanceFunnel data={treatmentFunnelData} />
      </div>
    </section>
  );
}
