"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { approveClientAccount, requestClientAccess, updateClientAccessStatus } from "@/lib/access-control";

export async function createClientAccountAction(formData: FormData) {
  const result = await requestClientAccess({
    email: String(formData.get("email") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    practiceName: String(formData.get("practiceName") ?? ""),
    packageType: String(formData.get("packageType") ?? "revenue_recovery_system")
  });
  revalidatePath("/internal/client-approvals");
  redirect(`/internal/client-approvals?${result.ok ? "status" : "error"}=${encodeURIComponent(result.message)}`);
}

export async function clientAccessAction(formData: FormData) {
  const clientAccountId = String(formData.get("clientAccountId") ?? "");
  const action = String(formData.get("action") ?? "") as "approve" | "suspend" | "revoke" | "activate" | "deactivate" | "resend_invitation";
  const organizationName = String(formData.get("organizationName") ?? "");

  const result = action === "approve"
    ? await approveClientAccount({ clientAccountId, organizationName })
    : await updateClientAccessStatus(clientAccountId, action);

  revalidatePath("/internal/client-approvals");
  redirect(`/internal/client-approvals?${result.ok ? "status" : "error"}=${encodeURIComponent(result.message)}`);
}
