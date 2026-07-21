"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import type { Category, Expense, ExtractedReceipt, Subscription, Tag } from "@/lib/types";
import { ReceiptCapture } from "@/components/ReceiptCapture";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({
  categories,
  tags,
  subscriptions = [],
  expense,
}: {
  categories: Category[];
  tags: Tag[];
  subscriptions?: Subscription[];
  expense?: Expense;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [merchant, setMerchant] = useState(expense?.merchant ?? "");
  const [categoryId, setCategoryId] = useState(expense?.category ?? "");
  const [date, setDate] = useState(expense ? expense.date.slice(0, 10) : todayISO());
  const [note, setNote] = useState(expense?.note ?? "");
  const [subscriptionId, setSubscriptionId] = useState(expense?.subscription ?? "");
  const [subscriptionTouched, setSubscriptionTouched] = useState(!!expense?.subscription);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(expense?.tags ?? []);
  const [newTagName, setNewTagName] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(id: string) {
    setSelectedTagIds((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
  }

  async function handleAddTag() {
    const name = newTagName.trim();
    if (!name) return;

    const existing = availableTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) setSelectedTagIds((c) => [...c, existing.id]);
      setNewTagName("");
      return;
    }

    setAddingTag(true);
    try {
      const created = await pb().collection("tags").create<Tag>({ name });
      setAvailableTags((c) => [...c, created]);
      setSelectedTagIds((c) => [...c, created.id]);
      setNewTagName("");
    } catch {
      setError("No se pudo crear la etiqueta. Intenta de nuevo.");
    } finally {
      setAddingTag(false);
    }
  }

  useEffect(() => {
    if (subscriptionTouched) return;
    const trimmed = merchant.trim().toLowerCase();
    if (!trimmed) {
      setSubscriptionId("");
      return;
    }
    const match = subscriptions.find((s) => {
      const name = s.name.trim().toLowerCase();
      return name === trimmed || trimmed.includes(name) || name.includes(trimmed);
    });
    setSubscriptionId(match?.id ?? "");
  }, [merchant, subscriptions, subscriptionTouched]);

  function handleExtracted(data: ExtractedReceipt, file: File) {
    setReceiptFile(file);
    if (data.amount) setAmount(String(Math.round(data.amount)));
    if (data.merchant) setMerchant(data.merchant);
    if (data.date) setDate(data.date);
    if (data.suggested_category) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === data.suggested_category!.toLowerCase()
      );
      if (match) setCategoryId(match.id);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      setError("Elige una categoría.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("merchant", merchant);
    formData.append("category", categoryId);
    formData.append("date", date);
    formData.append("note", note);
    formData.append("subscription", subscriptionId);
    if (selectedTagIds.length > 0) {
      for (const tagId of selectedTagIds) formData.append("tags", tagId);
    } else {
      formData.append("tags", "");
    }
    if (receiptFile) formData.append("receipt", receiptFile);

    try {
      if (expense) {
        await pb().collection("expenses").update(expense.id, formData);
      } else {
        await pb().collection("expenses").create(formData);
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo guardar el gasto. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await pb().collection("expenses").delete(expense!.id);
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo eliminar el gasto. Intenta de nuevo.");
      setDeleting(false);
    }
  }

  const existingReceiptUrl =
    expense?.receipt ? pb().files.getUrl(expense, expense.receipt, { thumb: "300x300" }) : undefined;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
      <ReceiptCapture
        categories={categories}
        onExtracted={handleExtracted}
        initialPreviewUrl={existingReceiptUrl}
      />

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Monto (CLP)
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
        Comercio
        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
          placeholder="Ej: Jumbo, Copec..."
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Categoría
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
        >
          <option value="" disabled>
            Elige una categoría
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Fecha
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
      </label>

      <div className="flex flex-col gap-2 text-sm text-gray-600">
        Etiquetas (opcional)
        <div className="flex flex-wrap gap-2">
          {availableTags.map((t) => {
            const selected = selectedTagIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  selected ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Nueva etiqueta"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-base"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={addingTag || !newTagName.trim()}
            className="shrink-0 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-60"
          >
            Agregar
          </button>
        </div>
      </div>

      {subscriptions.length > 0 && (
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          ¿Es parte de una suscripción? (opcional)
          <select
            value={subscriptionId}
            onChange={(e) => {
              setSubscriptionId(e.target.value);
              setSubscriptionTouched(true);
            }}
            className="rounded-lg border border-gray-300 px-4 py-3 text-base"
          >
            <option value="">Ninguna</option>
            {subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.owner})
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Nota (opcional)
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || deleting}
        className="rounded-lg bg-brand px-4 py-3 text-base font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Guardando..." : "Guardar gasto"}
      </button>

      {expense && !confirmingDelete && (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          disabled={submitting || deleting}
          className="rounded-lg px-4 py-3 text-sm font-medium text-red-600 disabled:opacity-60"
        >
          Eliminar gasto
        </button>
      )}

      {expense && confirmingDelete && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">¿Seguro que quieres eliminar este gasto?</p>
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
