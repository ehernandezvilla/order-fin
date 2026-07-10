"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import type { Expense } from "@/lib/types";
import { rangeFor, rangeLabel, toPbDateTime, type RangeKey } from "@/lib/format";
import { AmountSummary } from "@/components/AmountSummary";
import { RangeSelector } from "@/components/RangeSelector";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { BottomNav } from "@/components/BottomNav";

export default function SummaryPage() {
  const [range, setRange] = useState<RangeKey>("this_month");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = pb();
    if (!client.authStore.isValid) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    const { start, end } = rangeFor(range);
    client
      .collection("expenses")
      .getFullList<Expense>({
        filter: `date >= "${toPbDateTime(start)}" && date < "${toPbDateTime(end)}"`,
        sort: "-date",
        expand: "category",
      })
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, [range]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <header className="px-6 pt-6">
        <h1 className="text-lg font-semibold text-gray-900">Resumen</h1>
      </header>

      <RangeSelector value={range} onChange={setRange} />

      <AmountSummary total={total} label={rangeLabel(range)} />

      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-gray-400">Cargando...</p>
      ) : (
        <div className="pb-24">
          <CategoryBreakdown expenses={expenses} />
        </div>
      )}

      <BottomNav />
    </>
  );
}
