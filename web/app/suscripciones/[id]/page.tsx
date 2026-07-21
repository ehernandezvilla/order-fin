"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { Expense, Subscription } from "@/lib/types";
import { advanceByCycle } from "@/lib/format";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { ExpenseList } from "@/components/ExpenseList";

export default function SubscriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const load = useCallback(() => {
    const client = pb();
    if (!client.authStore.isValid) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    Promise.all([
      client.collection("subscriptions").getOne<Subscription>(params.id),
      client.collection("expenses").getFullList<Expense>({
        filter: `subscription = "${params.id}"`,
        sort: "-date",
        expand: "category,tags",
      }),
    ])
      .then(([sub, exp]) => {
        setSubscription(sub);
        setExpenses(exp);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRenew() {
    if (!subscription) return;
    setRenewing(true);
    try {
      const nextDate = advanceByCycle(subscription.next_renewal, subscription.billing_cycle);
      await pb().collection("subscriptions").update(subscription.id, { next_renewal: nextDate });
      load();
    } finally {
      setRenewing(false);
    }
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <Link href="/suscripciones" className="text-xl text-gray-400">
          ←
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Editar suscripción</h1>
      </header>

      {loading && <p className="px-6 py-10 text-center text-sm text-gray-400">Cargando...</p>}

      {!loading && notFound && (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-gray-400">No se encontró esa suscripción.</p>
          <button
            onClick={() => router.push("/suscripciones")}
            className="mt-4 text-sm font-medium text-brand"
          >
            Volver
          </button>
        </div>
      )}

      {!loading && subscription && (
        <>
          <div className="px-6 pt-6">
            <button
              type="button"
              onClick={handleRenew}
              disabled={renewing}
              className="w-full rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-medium text-brand disabled:opacity-60"
            >
              {renewing ? "Actualizando..." : "Marcar como renovada"}
            </button>
          </div>

          <SubscriptionForm subscription={subscription} />

          <div className="border-t border-gray-100 px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Gastos vinculados
            </p>
          </div>
          <ExpenseList
            expenses={expenses}
            emptyMessage="Aún no hay gastos vinculados a esta suscripción."
          />
        </>
      )}
    </>
  );
}
