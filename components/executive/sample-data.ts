import type { ChartDatum } from "@/components/charts";

export const revenueTrendData: ChartDatum[] = [
  { name: "Jan", value: 42000, secondary: 36000 },
  { name: "Feb", value: 52000, secondary: 41000 },
  { name: "Mar", value: 61000, secondary: 47000 },
  { name: "Apr", value: 68000, secondary: 52000 },
  { name: "May", value: 76000, secondary: 59000 },
  { name: "Jun", value: 88000, secondary: 67000 }
];

export const revenueLeakData: ChartDatum[] = [
  { name: "Recall", value: 32 },
  { name: "Treatment", value: 28 },
  { name: "No Show", value: 18 },
  { name: "Insurance", value: 22 }
];

export const patientSegmentData: ChartDatum[] = [
  { name: "Active", value: 48 },
  { name: "Recall Due", value: 24 },
  { name: "Treatment Open", value: 18 },
  { name: "At Risk", value: 10 }
];

export const providerPerformanceData: ChartDatum[] = [
  { name: "Dr. A", value: 94 },
  { name: "Dr. B", value: 87 },
  { name: "Dr. C", value: 81 },
  { name: "Dr. D", value: 74 }
];

export const forecastData: ChartDatum[] = [
  { name: "Now", value: 88000, secondary: 67000 },
  { name: "30d", value: 97000, secondary: 73000 },
  { name: "60d", value: 108000, secondary: 81000 },
  { name: "90d", value: 121000, secondary: 92000 }
];

export const recallFunnelData: ChartDatum[] = [
  { name: "Due", value: 420 },
  { name: "Reached", value: 338 },
  { name: "Booked", value: 214 },
  { name: "Kept", value: 186 }
];

export const treatmentFunnelData: ChartDatum[] = [
  { name: "Diagnosed", value: 180 },
  { name: "Presented", value: 154 },
  { name: "Accepted", value: 96 },
  { name: "Scheduled", value: 74 }
];

export const workflowHealthData: ChartDatum[] = [
  { name: "Healthy", value: 78 },
  { name: "Retrying", value: 12 },
  { name: "Blocked", value: 6 },
  { name: "Failed", value: 4 }
];
