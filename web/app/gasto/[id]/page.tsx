"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { Category, Expense, Tag } from "@/lib/types";
import { ExpenseForm } from "@/components/ExpenseForm";

export default function EditExpensePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const client = pb();
    if (!client.authStore.isValid) {
      window.location.href = "/login";
      return;
    }

    Promise.all([
      client.collection("categories").getFullList<Category>({ sort: "name" }),
      client.collection("tags").getFullList<Tag>({ sort: "name" }),
      client.collection("expenses").getOne<Expense>(params.id),
    ])
      .then(([cats, tgs, exp]) => {
        setCategories(cats);
        setTags(tgs);
        setExpense(exp);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <Link href="/" className="text-xl text-gray-400">
          ←
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Editar gasto</h1>
      </header>

      {loading && <p className="px-6 py-10 text-center text-sm text-gray-400">Cargando...</p>}

      {!loading && notFound && (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-gray-400">No se encontró ese gasto.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm font-medium text-brand"
          >
            Volver al inicio
          </button>
        </div>
      )}

      {!loading && expense && (
        <ExpenseForm categories={categories} tags={tags} expense={expense} />
      )}
    </>
  );
}
