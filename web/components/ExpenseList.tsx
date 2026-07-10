import Link from "next/link";
import type { Expense } from "@/lib/types";
import { formatCLP, formatDayLabel } from "@/lib/format";
import { pb } from "@/lib/pocketbase";

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-gray-400">
        Aún no registras gastos este mes.
      </p>
    );
  }

  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const day = expense.date.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(expense);
  }

  return (
    <div className="flex flex-col pb-24">
      {Array.from(groups.entries()).map(([day, items]) => (
        <div key={day}>
          <p className="bg-gray-50 px-6 py-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            {formatDayLabel(day)}
          </p>
          {items.map((expense) => {
            const category = expense.expand?.category;
            return (
              <Link
                key={expense.id}
                href={`/gasto/${expense.id}`}
                className="flex items-center gap-3 border-b border-gray-100 px-6 py-3 active:bg-gray-50"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: `${category?.color ?? "#6b7280"}22` }}
                >
                  {category?.icon ?? "🔖"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {expense.merchant || category?.name || "Gasto"}
                  </p>
                  <p className="truncate text-xs text-gray-400">{category?.name}</p>
                </div>
                {expense.receipt && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pb().files.getUrl(expense, expense.receipt, { thumb: "80x80" })}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                )}
                <p className="shrink-0 text-sm font-semibold text-gray-900">
                  {formatCLP(expense.amount)}
                </p>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
