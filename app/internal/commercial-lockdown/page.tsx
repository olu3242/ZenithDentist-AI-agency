import { CommercialLockdownCenter } from "@/components/internal/commercial-lockdown-center";
import { getCommercialLockdownState } from "@/lib/commercial-lockdown";

export default async function InternalCommercialLockdownPage() {
  const state = await getCommercialLockdownState();
  return <CommercialLockdownCenter state={state} />;
}
