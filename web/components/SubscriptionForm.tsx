"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import type { BillingCycle, Subscription, SubscriptionStatus } from "@/lib/types";
import { BILLING_CYCLE_OPTIONS, SUBSCRIPTION_STATUS_OPTIONS } from "@/lib/format";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function SubscriptionForm({
  subscription,
  linkExpenseId,
  initialName,
  initialAmount,
  initialNextRenewal,
}: {
  subscription?: Subscription;
  linkExpenseId?: string;
  initialName?: string;
  initialAmount?: string;
  initialNextRenewal?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(subscription?.name ?? initialName ?? "");
  const [owner, setOwner] = useState(subscription?.owner ?? "Yo");
  const [amount, setAmount] = useState(
    subscription ? String(subscription.amount) : initialAmount ?? ""
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    subscription?.billing_cycle ?? "mensual"
  );
  const [nextRenewal, setNextRenewal] = useState(
    subscription ? subscription.next_renewal.slice(0, 10) : initialNextRenewal ?? todayISO()
  );
  const [status, setStatus] = useState<SubscriptionStatus>(subscription?.status ?? "activa");
  const [notes, setNotes] = useState(subscription?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const data = {
      name,
      owner,
      amount: Number(amount),
      billing_cycle: billingCycle,
      next_renewal: nextRenewal,
      status,
      notes,
    };

    try {
      if (subscription) {
        await pb().collection("subscriptions").update(subscription.id, data);
        router.push("/suscripciones");
      } else {
        const created = await pb().collection("subscriptions").create<Subscription>(data);
        if (linkExpenseId) {
          await pb().collection("expenses").update(linkExpenseId, { subscription: created.id });
          router.push(`/gasto/${linkExpenseId}`);
        } else {
          router.push("/suscripciones");
        }
      }
      router.refresh();
    } catch {
      setError("No se pudo guardar la suscripción. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await pb().collection("subscriptions").delete(subscription!.id);
      router.push("/suscripciones");
      router.refresh();
    } catch {
      setError("No se pudo eliminar la suscripción. Intenta de nuevo.");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Nombre
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
          placeholder="Ej: Netflix, Spotify..."
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Para quién
        <input
          type="text"
          required
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
          placeholder="Ej: Yo, Mamá, Empresa..."
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Monto por ciclo (CLP)
        <input
          type="number"
          inputMode="numeric"
          required
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
          placeholder="0"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Frecuencia de cobro
        <select
          value={billingCycle}
          onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
        >
          {BILLING_CYCLE_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Próxima renovación
        <input
          type="date"
          required
          value={nextRenewal}
          onChange={(e) => setNextRenewal(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Estado
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
        >
          {SUBSCRIPTION_STATUS_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Notas (opcional)
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || deleting}
        className="rounded-lg bg-brand px-4 py-3 text-base font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Guardando..." : "Guardar suscripción"}
      </button>

      {subscription && !confirmingDelete && (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          disabled={submitting || deleting}
          className="rounded-lg px-4 py-3 text-sm font-medium text-red-600 disabled:opacity-60"
        >
          Eliminar suscripción
        </button>
      )}

      {subscription && confirmingDelete && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">¿Seguro que quieres eliminar esta suscripción?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
