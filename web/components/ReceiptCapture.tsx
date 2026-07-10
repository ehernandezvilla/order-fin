"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { Category, ExtractedReceipt } from "@/lib/types";

export function ReceiptCapture({
  categories,
  onExtracted,
}: {
  categories: Category[];
  onExtracted: (data: ExtractedReceipt, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setStatus("loading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("categories", JSON.stringify(categories.map((c) => c.name)));

    try {
      const res = await fetch("/api/extract-receipt", { method: "POST", body: formData });
      if (!res.ok) throw new Error("extract failed");
      const data = (await res.json()) as ExtractedReceipt;
      onExtracted(data, file);
      setStatus("idle");
    } catch {
      setStatus("error");
      onExtracted({ amount: null, merchant: null, date: null, suggested_category: null }, file);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Recibo" className="h-40 w-40 rounded-lg object-cover" />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-4xl text-gray-300">
          📷
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand"
      >
        {preview ? "Cambiar foto" : "Tomar foto / subir imagen"}
      </button>
      {status === "loading" && <p className="text-xs text-gray-400">Leyendo recibo...</p>}
      {status === "error" && (
        <p className="text-xs text-red-500">
          No se pudo leer automáticamente, completa los datos a mano.
        </p>
      )}
    </div>
  );
}
