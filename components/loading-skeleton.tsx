import { BrandLoading } from "@/components/brand/brand-loading";

/** Global loading skeleton — used by app/loading.tsx and any page-level Suspense */
export function LoadingSkeleton({ message }: { message?: string }) {
  return <BrandLoading message={message} />;
}
