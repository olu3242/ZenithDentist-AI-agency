import { CertificationCenter } from "@/components/production/certification-center";
import { getProductionCertificationState } from "@/lib/production-certification";

export default async function ProductionCertificationPage() {
  const state = await getProductionCertificationState();
  return <CertificationCenter state={state} />;
}
