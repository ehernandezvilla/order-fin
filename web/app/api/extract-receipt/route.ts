import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

const EXTRACT_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "extract_receipt",
    description:
      "Extrae los datos clave de una foto de un recibo, boleta o comprobante de compra chileno.",
    parameters: {
      type: "object",
      properties: {
        amount: {
          type: ["number", "null"],
          description:
            "Monto total de la compra en pesos chilenos (CLP), como número entero sin puntos ni símbolo. null si no se puede leer.",
        },
        merchant: {
          type: ["string", "null"],
          description: "Nombre del comercio o establecimiento donde se realizó la compra.",
        },
        date: {
          type: ["string", "null"],
          description:
            "Fecha de la compra en formato YYYY-MM-DD. Si el recibo usa DD-MM-YYYY, conviértela.",
        },
        suggested_category: {
          type: ["string", "null"],
          description:
            "La categoría más adecuada para este gasto, elegida EXACTAMENTE entre las categorías provistas en el mensaje.",
        },
      },
      required: ["amount", "merchant", "date", "suggested_category"],
    },
  },
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY / OPENROUTER_MODEL no configuradas" },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const categoriesRaw = formData.get("categories");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagen demasiado grande" }, { status: 400 });
  }

  let categories: string[] = [];
  if (typeof categoriesRaw === "string") {
    try {
      const parsed = JSON.parse(categoriesRaw);
      if (Array.isArray(parsed)) categories = parsed;
    } catch {
      categories = [];
    }
  }

  const mediaType: AllowedType = ALLOWED_TYPES.includes(file.type as AllowedType)
    ? (file.type as AllowedType)
    : "image/jpeg";
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const openrouter = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "X-Title": "Orden Fin",
      ...(process.env.OPENROUTER_SITE_URL
        ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
        : {}),
    },
  });

  try {
    const completion = await openrouter.chat.completions.create({
      model,
      max_tokens: 512,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "function", function: { name: "extract_receipt" } },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64}` },
            },
            {
              type: "text",
              text: `Extrae los datos de este recibo/comprobante de compra chileno. Categorías disponibles: ${
                categories.join(", ") || "Otros"
              }. suggested_category debe ser exactamente una de esas categorías (usa "Otros" si ninguna calza bien). Si no puedes determinar con confianza algún otro campo, usa null para ese campo.`,
            },
          ],
        },
      ],
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function") {
      return NextResponse.json({ error: "No se pudo leer el recibo" }, { status: 422 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return NextResponse.json({ error: "No se pudo leer el recibo" }, { status: 422 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("extract-receipt failed", err);
    return NextResponse.json({ error: "Error al procesar la imagen" }, { status: 500 });
  }
}
