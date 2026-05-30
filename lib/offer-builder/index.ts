import "server-only";

export type { PackageDefinition, PackageKey, WorkflowId } from "@/lib/offer-builder/packages";
export { PACKAGES, getPackage } from "@/lib/offer-builder/packages";

export type {
  ScopeItem,
  ProposalPricing,
  ProposalDocument,
} from "@/lib/offer-builder/proposal-generator";
export {
  generateProposal,
  saveProposal,
  listProposals,
} from "@/lib/offer-builder/proposal-generator";
