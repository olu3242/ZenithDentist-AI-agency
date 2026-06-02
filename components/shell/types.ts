export interface KpiItem {
  label: string;
  value: string | number;
  tone?: "primary" | "secondary" | "accent" | "success" | "warning" | "danger";
  change?: string;
  changePositive?: boolean;
  icon?: React.ElementType;
}

export interface InsightCard {
  title: string;
  summary: string;
  confidence: number;
  tone?: "primary" | "success" | "warning" | "danger";
  traceId?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export interface ActionCard {
  title: string;
  description: string;
  icon?: React.ElementType;
  href?: string;
  onClick?: () => void;
  tone?: "primary" | "success" | "warning" | "danger";
  badge?: string;
}

export interface TimelineItem {
  title: string;
  description?: string;
  timestamp: string;
  icon?: React.ElementType;
  tone?: "primary" | "success" | "warning" | "danger" | "accent";
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}
