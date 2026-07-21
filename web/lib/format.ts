import type { BillingCycle, SubscriptionStatus } from "./types";

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

export function localDateISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toPbDateTime(date: Date): string {
  return `${localDateISO(date)} 00:00:00.000Z`;
}

export function tagFilterExpr(tagIds: string[]): string {
  if (tagIds.length === 0) return "";
  return tagIds.map((id) => `tags.id ?= "${id}"`).join(" || ");
}

export function formatDayLabel(isoDate: string): string {
  const d = new Date(isoDate.slice(0, 10) + "T00:00:00");
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

export const BILLING_CYCLE_OPTIONS: { key: BillingCycle; label: string; months: number }[] = [
  { key: "mensual", label: "Mensual", months: 1 },
  { key: "trimestral", label: "Trimestral", months: 3 },
  { key: "semestral", label: "Semestral", months: 6 },
  { key: "anual", label: "Anual", months: 12 },
];

export const SUBSCRIPTION_STATUS_OPTIONS: { key: SubscriptionStatus; label: string }[] = [
  { key: "activa", label: "Activa" },
  { key: "pausada", label: "Pausada" },
  { key: "cancelada", label: "Cancelada" },
];

export function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  const option = BILLING_CYCLE_OPTIONS.find((o) => o.key === cycle);
  return amount / (option?.months ?? 1);
}

export function daysUntil(isoDate: string, reference: Date = new Date()): number {
  const target = new Date(isoDate.slice(0, 10) + "T00:00:00");
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function renewalLabel(isoDate: string, reference: Date = new Date()): string {
  const days = daysUntil(isoDate, reference);
  if (days < 0) return `Vencida hace ${Math.abs(days)} días`;
  if (days === 0) return "Renueva hoy";
  if (days === 1) return "Renueva mañana";
  return `Renueva en ${days} días`;
}

export function advanceByCycle(isoDate: string, cycle: BillingCycle): string {
  const option = BILLING_CYCLE_OPTIONS.find((o) => o.key === cycle);
  const months = option?.months ?? 1;
  const date = new Date(isoDate.slice(0, 10) + "T00:00:00");
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}
