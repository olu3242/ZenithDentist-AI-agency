import { brandConfig } from "@/lib/brand";

export function BackgroundWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 320 320"
        className="absolute right-[-8vw] top-20 h-[min(70vh,720px)] w-[min(70vw,720px)] object-contain opacity-[0.035]"
        role="presentation"
      >
        <path d="M48 48H272L128 176H272V272H48L192 144H48V48Z" fill={brandConfig.colors.primary} />
        <path d="M122 104H198V124H122V104Z" fill={brandConfig.colors.secondary} />
        <path d="M148 78H172V150H148V78Z" fill={brandConfig.colors.secondary} />
      </svg>
    </div>
  );
}
