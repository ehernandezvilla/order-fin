import type { Expense } from "@/lib/types";
import { formatCLP } from "@/lib/format";

interface TagTotal {
  id: string;
  name: string;
  total: number;
}

export function TagBreakdown({ expenses }: { expenses: Expense[] }) {
  const totals = new Map<string, TagTotal>();
  for (const expense of expenses) {
    for (const tag of expense.expand?.tags ?? []) {
      const existing = totals.get(tag.id);
      if (existing) {
        existing.total += expense.amount;
      } else {
        totals.set(tag.id, { id: tag.id, name: tag.name, total: expense.amount });
      }
    }
  }

  if (totals.size === 0) {
    return (
      <p className="px-6 py-6 text-center text-sm text-gray-400">
        Ningún gasto de este rango tiene etiquetas.
      </p>
    );
  }

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const sorted = Array.from(totals.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        Por etiqueta (los porcentajes no suman 100%: un gasto puede tener varias etiquetas)
      </p>
      {sorted.map((t) => {
        const pct = grandTotal > 0 ? Math.round((t.total / grandTotal) * 100) : 0;
        return (
          <div key={t.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">{t.name}</span>
              <span className="text-gray-500">
                {formatCLP(t.total)} · {pct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
