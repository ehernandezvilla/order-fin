"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import type { Expense, Tag } from "@/lib/types";
import { rangeFor, rangeLabel, tagFilterExpr, toPbDateTime, type RangeKey } from "@/lib/format";
import { AmountSummary } from "@/components/AmountSummary";
import { RangeSelector } from "@/components/RangeSelector";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { TagFilter } from "@/components/TagFilter";
import { BottomNav } from "@/components/BottomNav";

export default function SummaryPage() {
  const [range, setRange] = useState<RangeKey>("this_month");
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
    const { start, end } = rangeFor(range);
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
  }, [range, selectedTagIds]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <header className="px-6 pt-6">
        <h1 className="text-lg font-semibold text-gray-900">Resumen</h1>
      </header>

      <RangeSelector value={range} onChange={setRange} />

      <AmountSummary total={total} label={rangeLabel(range)} />

      <TagFilter tags={tags} selected={selectedTagIds} onChange={setSelectedTagIds} />

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
