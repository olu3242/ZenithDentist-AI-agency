import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ height: "100%", width: "100%", background: "#18212f", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", padding: 72 }}>
        <div style={{ fontSize: 28, color: "#8dd7ce", fontWeight: 800 }}>ZENITH AI</div>
        <div style={{ fontSize: 78, fontWeight: 900, lineHeight: 1.02, marginTop: 24 }}>Patient Revenue Engine for Dental Practices</div>
        <div style={{ fontSize: 30, color: "#d9e0e7", marginTop: 28 }}>Recover no-shows, recall revenue, and operational capacity.</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
