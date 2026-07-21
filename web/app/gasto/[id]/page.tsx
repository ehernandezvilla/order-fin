"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { Category, Expense, Subscription, Tag } from "@/lib/types";
import { advanceByCycle } from "@/lib/format";
import { ExpenseForm } from "@/components/ExpenseForm";

export default function EditExpensePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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
      client
        .collection("subscriptions")
        .getFullList<Subscription>({ filter: 'status != "cancelada"', sort: "name" }),
      client.collection("expenses").getOne<Expense>(params.id, { expand: "subscription" }),
    ])
      .then(([cats, tgs, subs, exp]) => {
        setCategories(cats);
        setTags(tgs);
        setSubscriptions(subs);
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
        <>
          {expense.subscription ? (
            <div className="mx-6 mt-6 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-600">
                Vinculado a{" "}
                <span className="font-medium text-gray-900">
                  {expense.expand?.subscription?.name ?? "suscripción"}
                </span>
              </span>
              <Link
                href={`/suscripciones/${expense.subscription}`}
                className="font-medium text-brand"
              >
                Ver
              </Link>
            </div>
          ) : (
            <div className="mx-6 mt-6">
              <Link
                href={`/suscripciones/nueva?expenseId=${expense.id}&name=${encodeURIComponent(
                  expense.merchant
                )}&amount=${expense.amount}&nextRenewal=${advanceByCycle(
                  expense.date.slice(0, 10),
                  "mensual"
                )}`}
                className="block rounded-lg border border-dashed border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-600"
              >
                🔁 Convertir en suscripción
              </Link>
            </div>
          )}

          <ExpenseForm
            categories={categories}
            tags={tags}
            subscriptions={subscriptions}
            expense={expense}
          />
        </>
      )}
    </>
  );
}
