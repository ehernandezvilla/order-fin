import type { Expense } from "@/lib/types";
import { formatCLP } from "@/lib/format";

interface CategoryTotal {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
}

export function CategoryBreakdown({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-gray-400">
        No hay gastos en este rango.
      </p>
    );
  }

  const totals = new Map<string, CategoryTotal>();
  for (const expense of expenses) {
    const category = expense.expand?.category;
    const key = category?.id ?? "sin-categoria";
    const existing = totals.get(key);
    if (existing) {
      existing.total += expense.amount;
    } else {
      totals.set(key, {
        id: key,
        name: category?.name ?? "Sin categoría",
        icon: category?.icon ?? "🔖",
        color: category?.color ?? "#6b7280",
        total: expense.amount,
      });
    }
  }

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const sorted = Array.from(totals.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      {sorted.map((c) => {
        const pct = grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0;
        return (
          <div key={c.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-gray-900">
                <span>{c.icon}</span>
                {c.name}
              </span>
              <span className="text-gray-500">
                {formatCLP(c.total)} · {pct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: c.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
