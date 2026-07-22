import type { Expense } from "@/lib/types";
import { formatCLP, monthKey, monthShortLabel, MONTHLY_AVERAGE_WINDOW } from "@/lib/format";

export function MonthlyAverage({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <p className="px-6 py-6 text-center text-sm text-gray-400">
        Aún no hay historial suficiente para calcular un promedio mensual.
      </p>
    );
  }

  const now = new Date();
  const currentKey = monthKey(now);

  const totalsByMonth = new Map<string, number>();
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + e.amount);
  }

  const months = Array.from({ length: MONTHLY_AVERAGE_WINDOW }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHLY_AVERAGE_WINDOW - 1 - i), 1);
    const key = monthKey(d);
    return { key, label: monthShortLabel(key), total: totalsByMonth.get(key) ?? 0 };
  });

  const closedMonths = months.filter((m) => m.key !== currentKey && m.total > 0);
  const average =
    closedMonths.length > 0
      ? closedMonths.reduce((sum, m) => sum + m.total, 0) / closedMonths.length
      : 0;

  const current = months.find((m) => m.key === currentKey)?.total ?? 0;
  const delta = average > 0 ? Math.round(((current - average) / average) * 100) : null;
  const maxTotal = Math.max(...months.map((m) => m.total), 1);

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        Promedio mensual (últimos {MONTHLY_AVERAGE_WINDOW} meses)
      </p>

      {closedMonths.length > 0 ? (
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-semibold text-gray-900">{formatCLP(average)}</p>
          {delta !== null && (
            <span
              className={`text-sm font-medium ${
                delta > 0 ? "text-rose-600" : delta < 0 ? "text-brand" : "text-gray-500"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta}% este mes vs promedio
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Necesitas al menos un mes anterior con gastos para calcular un promedio.
        </p>
      )}

      <div className="flex items-end gap-2">
        {months.map((m) => (
          <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full items-end">
              <div
                className={`w-full rounded-t ${m.key === currentKey ? "bg-brand" : "bg-gray-200"}`}
                style={{ height: `${Math.max((m.total / maxTotal) * 100, 2)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
