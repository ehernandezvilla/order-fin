import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { pbServer } from "@/lib/pocketbaseServer";
import { hashApiToken, isValidTokenFormat } from "@/lib/apiKeys";
import { toPbDateTime } from "@/lib/format";
import type { ApiKey, Category, Expense, Tag } from "@/lib/types";

export const runtime = "nodejs";

function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function dateRangeFilter(from?: string, to?: string): string[] {
  const filters: string[] = [];
  if (from) filters.push(`date >= "${toPbDateTime(new Date(from))}"`);
  if (to) filters.push(`date < "${toPbDateTime(new Date(to))}"`);
  return filters;
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_expenses",
      {
        title: "Listar gastos",
        description:
          "Lista gastos registrados, opcionalmente filtrados por rango de fecha, categoría o etiqueta.",
        inputSchema: {
          from: z.string().optional().describe("Fecha inicio YYYY-MM-DD (inclusive)"),
          to: z.string().optional().describe("Fecha fin YYYY-MM-DD (exclusive)"),
          category: z.string().optional().describe("Nombre exacto de la categoría"),
          tag: z.string().optional().describe("Nombre exacto de la etiqueta"),
          limit: z
            .number()
            .int()
            .min(1)
            .max(200)
            .optional()
            .describe("Máximo de resultados a devolver (default 50)"),
        },
      },
      async ({ from, to, category, tag, limit }) => {
        const client = await pbServer();
        const filters = dateRangeFilter(from, to);
        if (category) filters.push(`category.name = "${escapeFilterValue(category)}"`);
        if (tag) filters.push(`tags.name ?= "${escapeFilterValue(tag)}"`);

        const result = await client.collection("expenses").getList<Expense>(1, limit ?? 50, {
          filter: filters.join(" && "),
          sort: "-date",
          expand: "category,tags",
        });

        const items = result.items.map((e) => ({
          id: e.id,
          amount: e.amount,
          merchant: e.merchant,
          category: e.expand?.category?.name ?? null,
          date: e.date,
          note: e.note,
          tags: (e.expand?.tags ?? []).map((t) => t.name),
        }));

        return { content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }] };
      }
    );

    server.registerTool(
      "get_summary",
      {
        title: "Resumen de gastos",
        description: "Suma de gastos agrupados por categoría o por etiqueta en un rango de fechas.",
        inputSchema: {
          from: z.string().optional().describe("Fecha inicio YYYY-MM-DD (inclusive)"),
          to: z.string().optional().describe("Fecha fin YYYY-MM-DD (exclusive)"),
          group_by: z.enum(["category", "tag"]).describe("Agrupar por categoría o por etiqueta"),
        },
      },
      async ({ from, to, group_by }) => {
        const client = await pbServer();
        const filters = dateRangeFilter(from, to);

        const expenses = await client.collection("expenses").getFullList<Expense>({
          filter: filters.join(" && "),
          expand: "category,tags",
        });

        const totals = new Map<string, number>();
        if (group_by === "category") {
          for (const e of expenses) {
            const name = e.expand?.category?.name ?? "Sin categoría";
            totals.set(name, (totals.get(name) ?? 0) + e.amount);
          }
        } else {
          for (const e of expenses) {
            for (const t of e.expand?.tags ?? []) {
              totals.set(t.name, (totals.get(t.name) ?? 0) + e.amount);
            }
          }
        }

        const breakdown = Array.from(totals.entries())
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total);

        return { content: [{ type: "text" as const, text: JSON.stringify(breakdown, null, 2) }] };
      }
    );

    server.registerTool(
      "list_categories",
      { title: "Listar categorías", description: "Lista las categorías de gasto disponibles." },
      async () => {
        const client = await pbServer();
        const categories = await client
          .collection("categories")
          .getFullList<Category>({ sort: "name" });
        const items = categories.map((c) => ({ name: c.name, icon: c.icon, color: c.color }));
        return { content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }] };
      }
    );

    server.registerTool(
      "list_tags",
      { title: "Listar etiquetas", description: "Lista las etiquetas disponibles." },
      async () => {
        const client = await pbServer();
        const tags = await client.collection("tags").getFullList<Tag>({ sort: "name" });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(tags.map((t) => t.name), null, 2) }],
        };
      }
    );
  },
  {},
  { basePath: "/api", disableSse: true }
);

async function verifyToken(_req: Request, bearerToken?: string) {
  if (!bearerToken || !isValidTokenFormat(bearerToken)) return undefined;

  const client = await pbServer();
  const hash = await hashApiToken(bearerToken);
  try {
    const key = await client.collection("api_keys").getFirstListItem<ApiKey>(`hash = "${hash}"`);
    await client
      .collection("api_keys")
      .update(key.id, { last_used: new Date().toISOString() })
      .catch(() => {});
    return { token: bearerToken, clientId: key.id, scopes: ["read"] };
  } catch {
    return undefined;
  }
}

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
