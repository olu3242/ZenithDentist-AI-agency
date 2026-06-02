import { ClientImplementationCenter } from "@/components/internal/client-implementation-center";
import { getClientImplementationState } from "@/lib/client-implementation-os";

export default async function InternalOnboardingPage() {
  const state = await getClientImplementationState();
  return <ClientImplementationCenter state={state} section="onboarding" />;
}
