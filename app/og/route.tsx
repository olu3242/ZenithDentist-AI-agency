import { ImageResponse } from "next/og";
import { brandConfig } from "@/lib/brand";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ height: "100%", width: "100%", background: brandConfig.colors.navy, color: "white", display: "flex", flexDirection: "column", justifyContent: "center", padding: 72 }}>
        <div style={{ fontSize: 28, color: brandConfig.colors.primary, fontWeight: 800 }}>{brandConfig.name}</div>
        <div style={{ fontSize: 78, fontWeight: 900, lineHeight: 1.02, marginTop: 24 }}>{brandConfig.trademark}</div>
        <div style={{ fontSize: 30, color: brandConfig.colors.inverseMuted, marginTop: 28 }}>{brandConfig.tagline}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
