"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { Expense } from "@/lib/types";
import { monthLabel, monthRange, toPbDateTime } from "@/lib/format";
import { AmountSummary } from "@/components/AmountSummary";
import { ExpenseList } from "@/components/ExpenseList";
import { BottomNav } from "@/components/BottomNav";

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = pb();
    if (!client.authStore.isValid) {
      window.location.href = "/login";
      return;
    }

    const { start, end } = monthRange();
    client
      .collection("expenses")
      .getFullList<Expense>({
        filter: `date >= "${toPbDateTime(start)}" && date < "${toPbDateTime(end)}"`,
        sort: "-date",
        expand: "category",
      })
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, []);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  function handleLogout() {
    pb().authStore.clear();
    window.location.href = "/login";
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 pt-6">
        <h1 className="text-lg font-semibold text-gray-900">Orden Fin</h1>
        <button onClick={handleLogout} className="text-sm text-gray-400">
          Salir
        </button>
      </header>

      <div className="mt-4">
        <AmountSummary total={total} label={monthLabel()} />
      </div>

      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-gray-400">Cargando...</p>
      ) : (
        <ExpenseList expenses={expenses} />
      )}

      <Link
        href="/new"
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-3xl font-light text-white shadow-lg"
      >
        +
      </Link>

      <BottomNav />
    </>
  );
}
