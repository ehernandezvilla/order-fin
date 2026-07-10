"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import type { Category, ExtractedReceipt } from "@/lib/types";
import { ReceiptCapture } from "@/components/ReceiptCapture";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (receiptFile) formData.append("receipt", receiptFile);

    try {
      await pb().collection("expenses").create(formData);
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo guardar el gasto. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
      <ReceiptCapture categories={categories} onExtracted={handleExtracted} />

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
        disabled={submitting}
        className="rounded-lg bg-brand px-4 py-3 text-base font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Guardando..." : "Guardar gasto"}
      </button>
    </form>
  );
}
