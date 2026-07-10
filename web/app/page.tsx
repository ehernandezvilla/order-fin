"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { Expense, Tag } from "@/lib/types";
import { monthLabel, monthRange, tagFilterExpr, toPbDateTime } from "@/lib/format";
import { AmountSummary } from "@/components/AmountSummary";
import { ExpenseList } from "@/components/ExpenseList";
import { TagFilter } from "@/components/TagFilter";
import { BottomNav } from "@/components/BottomNav";

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = pb();
    if (!client.authStore.isValid) {
      window.location.href = "/login";
      return;
    }
    client.collection("tags").getFullList<Tag>({ sort: "name" }).then(setTags);
  }, []);

  useEffect(() => {
    const client = pb();
    if (!client.authStore.isValid) return;

    setLoading(true);
    const { start, end } = monthRange();
    let filter = `date >= "${toPbDateTime(start)}" && date < "${toPbDateTime(end)}"`;
    const tagFilter = tagFilterExpr(selectedTagIds);
    if (tagFilter) filter += ` && (${tagFilter})`;

    client
      .collection("expenses")
      .getFullList<Expense>({
        filter,
        sort: "-date",
        expand: "category,tags",
      })
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, [selectedTagIds]);

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

      <TagFilter tags={tags} selected={selectedTagIds} onChange={setSelectedTagIds} />

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
