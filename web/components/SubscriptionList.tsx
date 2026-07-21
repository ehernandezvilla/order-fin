import Link from "next/link";
import type { Subscription } from "@/lib/types";
import { daysUntil, formatCLP, monthlyEquivalent, renewalLabel } from "@/lib/format";

const STATUS_ORDER: Record<Subscription["status"], number> = {
  activa: 0,
  pausada: 1,
  cancelada: 2,
};

function badgeClasses(days: number): string {
  if (days < 0) return "bg-red-100 text-red-700";
  if (days <= 7) return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-500";
}

export function SubscriptionList({ subscriptions }: { subscriptions: Subscription[] }) {
  if (subscriptions.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-gray-400">
        Aún no registras suscripciones.
      </p>
    );
  }

  const sorted = [...subscriptions].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.next_renewal.localeCompare(b.next_renewal);
  });

  return (
    <div className="flex flex-col divide-y divide-gray-100 pb-24">
      {sorted.map((s) => {
        const days = daysUntil(s.next_renewal);
        return (
          <Link
            key={s.id}
            href={`/suscripciones/${s.id}`}
            className="flex items-center gap-3 px-6 py-3 active:bg-gray-50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{s.name}</p>
              <p className="truncate text-xs text-gray-400">{s.owner}</p>
              {s.status === "activa" && (
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] ${badgeClasses(days)}`}
                >
                  {renewalLabel(s.next_renewal)}
                </span>
              )}
              {s.status !== "activa" && (
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                  {s.status === "pausada" ? "Pausada" : "Cancelada"}
                </span>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900">{formatCLP(s.amount)}</p>
              <p className="text-xs text-gray-400">
                {formatCLP(monthlyEquivalent(s.amount, s.billing_cycle))}/mes
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
