export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function monthRange(reference: Date = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return { start, end };
}

export function toPbDateTime(date: Date): string {
  return date.toISOString().replace("T", " ");
}

export function tagFilterExpr(tagIds: string[]): string {
  if (tagIds.length === 0) return "";
  return tagIds.map((id) => `tags.id ?= "${id}"`).join(" || ");
}

export function formatDayLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const label = new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthLabel(reference: Date = new Date()): string {
  const label = new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
  }).format(reference);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type RangeKey = "this_month" | "last_7_days" | "prev_month";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "this_month", label: "Este mes" },
  { key: "last_7_days", label: "Últimos 7 días" },
  { key: "prev_month", label: "Mes anterior" },
];

export function rangeFor(key: RangeKey, reference: Date = new Date()) {
  if (key === "this_month") {
    return monthRange(reference);
  }
  if (key === "prev_month") {
    const prevMonthRef = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
    return monthRange(prevMonthRef);
  }
  const end = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 1);
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - 6);
  return { start, end };
}

export function rangeLabel(key: RangeKey, reference: Date = new Date()): string {
  if (key === "this_month") return monthLabel(reference);
  if (key === "last_7_days") return "Últimos 7 días";
  const prevMonthRef = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return monthLabel(prevMonthRef);
}
