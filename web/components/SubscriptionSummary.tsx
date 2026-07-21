import { daysUntil, formatCLP, monthlyEquivalent, renewalLabel } from "@/lib/format";
import type { Subscription } from "@/lib/types";

export function SubscriptionSummary({ subscriptions }: { subscriptions: Subscription[] }) {
  const active = subscriptions.filter((s) => s.status === "activa");
  const monthlyTotal = active.reduce(
    (sum, s) => sum + monthlyEquivalent(s.amount, s.billing_cycle),
    0
  );
  const upcoming = active
    .filter((s) => daysUntil(s.next_renewal) <= 7)
    .sort((a, b) => a.next_renewal.localeCompare(b.next_renewal));

  return (
    <>
      <section className="bg-brand px-6 py-6 text-white">
        <p className="text-sm opacity-80">
          {active.length} suscripción{active.length === 1 ? "" : "es"} activa
          {active.length === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-3xl font-semibold">{formatCLP(monthlyTotal)}</p>
        <p className="mt-1 text-xs opacity-70">equivalente mensual</p>
      </section>

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-amber-50 px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Renuevan pronto
          </p>
          {upcoming.map((s) => (
            <p key={s.id} className="text-sm text-amber-900">
              <span className="font-medium">{s.name}</span> · {renewalLabel(s.next_renewal)}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
