"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { Category } from "@/lib/types";
import { ExpenseForm } from "@/components/ExpenseForm";

export default function NewExpensePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pb()
      .collection("categories")
      .getFullList<Category>({ sort: "name" })
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <Link href="/" className="text-xl text-gray-400">
          ←
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Nuevo gasto</h1>
      </header>

      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-gray-400">Cargando...</p>
      ) : (
        <ExpenseForm categories={categories} />
      )}
    </>
  );
}
