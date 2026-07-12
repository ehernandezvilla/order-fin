"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { ApiKey } from "@/lib/types";
import { generateApiToken, hashApiToken, tokenPrefix } from "@/lib/apiKeys";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  );
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = pb();
    if (!client.authStore.isValid) {
      window.location.href = "/login";
      return;
    }
    client
      .collection("api_keys")
      .getFullList<ApiKey>({ sort: "-created" })
      .then(setKeys)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    const label = name.trim();
    if (!label) return;

    setCreating(true);
    setError(null);
    try {
      const token = generateApiToken();
      const hash = await hashApiToken(token);
      const created = await pb().collection("api_keys").create<ApiKey>({
        name: label,
        prefix: tokenPrefix(token),
        hash,
      });
      setKeys((current) => [created, ...current]);
      setNewToken(token);
      setName("");
    } catch {
      setError("No se pudo crear la clave. Intenta de nuevo.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id);
    setError(null);
    try {
      await pb().collection("api_keys").delete(id);
      setKeys((current) => current.filter((k) => k.id !== id));
    } catch {
      setError("No se pudo revocar la clave. Intenta de nuevo.");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleCopy() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <Link href="/" className="text-xl text-gray-400">
          ←
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Ajustes</h1>
      </header>

      <div className="flex flex-col gap-6 px-6 py-6 pb-16">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Claves de API (MCP)</h2>
          <p className="mt-1 text-sm text-gray-500">
            Úsalas para conectar un agente externo (ej. Hermes) al endpoint{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/api/mcp</code>, con acceso
            de solo lectura a tus gastos. Puedes revocar una clave en cualquier momento.
          </p>
        </div>

        {newToken && (
          <div className="flex flex-col gap-2 rounded-lg border border-brand/30 bg-brand/5 p-4">
            <p className="text-sm font-medium text-gray-900">
              Copia esta clave ahora, no se volverá a mostrar:
            </p>
            <code className="break-all rounded bg-white px-3 py-2 text-sm text-gray-900 shadow-sm">
              {newToken}
            </code>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
              >
                {copied ? "Copiada ✓" : "Copiar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewToken(null);
                  setCopied(false);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600"
              >
                Listo
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Nombre, ej: Hermes VPS"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="shrink-0 rounded-lg bg-brand px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {creating ? "Creando..." : "Generar clave"}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="py-6 text-center text-sm text-gray-400">Cargando...</p>
        ) : keys.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No hay claves creadas todavía.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-gray-900">{k.name}</span>
                  <span className="text-xs text-gray-400">
                    {k.prefix}… · creada {formatDateTime(k.created)} ·{" "}
                    {k.last_used ? `usada ${formatDateTime(k.last_used)}` : "sin usar"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(k.id)}
                  disabled={revokingId === k.id}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-60"
                >
                  {revokingId === k.id ? "Revocando..." : "Revocar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
