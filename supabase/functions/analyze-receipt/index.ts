import { GoogleGenAI } from "npm:@google/genai";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "gemini-3.8-flash";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function publishableKey() {
  const modern = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (modern) {
    try {
      const parsed = JSON.parse(modern);
      if (parsed?.default) return parsed.default as string;
    } catch {
      // Fall through to the legacy anon key.
    }
  }

  return Deno.env.get("SUPABASE_ANON_KEY") ?? "";
}

function normalizeIssuedAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  const raw = value.trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(raw + "T12:00:00")
    : new Date(raw);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método no permitido." }, 405);
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return json(
      {
        error:
          "Falta configurar GEMINI_API_KEY en los secretos de Supabase Edge Functions.",
        code: "GEMINI_KEY_MISSING",
      },
      503,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Sesión no válida." }, 401);
  }

  const token = authHeader.slice("Bearer ".length);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    publishableKey(),
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return json({ error: "Sesión no válida." }, 401);
  }

  let body: { receiptId?: string };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Solicitud inválida." }, 400);
  }

  const receiptId = body.receiptId?.trim();
  if (!receiptId) {
    return json({ error: "Falta receiptId." }, 400);
  }

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("id, created_by, image_path, mime_type")
    .eq("id", receiptId)
    .maybeSingle();

  if (receiptError || !receipt) {
    return json(
      { error: receiptError?.message ?? "Comprobante no encontrado." },
      404,
    );
  }

  if (receipt.created_by !== user.id) {
    return json(
      { error: "Solo quien subió el comprobante puede analizarlo." },
      403,
    );
  }

  const mimeType = String(receipt.mime_type || "image/jpeg").toLowerCase();

  const [imageResult, categoryResult, paymentResult] = await Promise.all([
    supabase.storage.from("receipts").download(receipt.image_path),
    supabase
      .from("expense_categories")
      .select("slug, name")
      .order("created_at", { ascending: true }),
    supabase
      .from("payment_methods")
      .select("slug, name")
      .order("created_at", { ascending: true }),
  ]);

  if (imageResult.error || !imageResult.data) {
    return json(
      {
        error:
          imageResult.error?.message ??
          "No se pudo cargar la imagen del comprobante.",
      },
      500,
    );
  }

  const imageBytes = new Uint8Array(await imageResult.data.arrayBuffer());
  const base64Image = bytesToBase64(imageBytes);

  const categories = (categoryResult.data ?? []).map((item: any) => ({
    slug: String(item.slug),
    name: String(item.name),
  }));

  const payments = (paymentResult.data ?? []).map((item: any) => ({
    slug: String(item.slug),
    name: String(item.name),
  }));

  const categoryPrompt = categories.length
    ? categories
        .map((item) => item.slug + " = " + item.name)
        .join(", ")
    : "otros";

  const paymentPrompt = payments.length
    ? payments
        .map((item) => item.slug + " = " + item.name)
        .join(", ")
    : "sin opciones";

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      merchant_name: { type: ["string", "null"] },
      merchant_tax_id: { type: ["string", "null"] },
      document_type: {
        type: ["string", "null"],
        enum: ["boleta", "factura", "ticket", "recibo", "otro", null],
      },
      document_number: { type: ["string", "null"] },
      issued_at: { type: ["string", "null"] },
      subtotal: { type: ["number", "null"] },
      tax_amount: { type: ["number", "null"] },
      discount_amount: { type: ["number", "null"] },
      total_amount: { type: ["number", "null"] },
      currency: { type: "string" },
      payment_method_guess: { type: ["string", "null"] },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            description: { type: "string" },
            quantity: { type: ["number", "null"] },
            unit_price: { type: ["number", "null"] },
            line_total: { type: ["number", "null"] },
            category: { type: ["string", "null"] },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
          },
          required: [
            "description",
            "quantity",
            "unit_price",
            "line_total",
            "category",
            "confidence",
          ],
        },
      },
    },
    required: [
      "merchant_name",
      "merchant_tax_id",
      "document_type",
      "document_number",
      "issued_at",
      "subtotal",
      "tax_amount",
      "discount_amount",
      "total_amount",
      "currency",
      "payment_method_guess",
      "confidence",
      "items",
    ],
  };

  const prompt = [
    "Analiza esta imagen de un comprobante de compra.",
    "Puede ser boleta, factura, ticket, recibo, POS, grifo, supermercado, restaurante, farmacia, mercado, taller o servicio.",
    "Extrae únicamente información visible; no inventes datos. Si un dato no se puede leer con seguridad, devuelve null.",
    "Identifica comercio, RUC/identificación fiscal, tipo y número de comprobante, fecha, subtotal, impuestos, descuentos, total y moneda.",
    "Extrae cada producto o servicio como una línea independiente.",
    "No conviertas subtotal, IGV/impuestos, redondeo, vuelto, propina global o total en productos.",
    "En grifos/estaciones, combustible/GLP/GNV puede ser una línea de producto. Si aparecen litros o galones, usa quantity.",
    "En restaurantes, cada plato, bebida o servicio visible puede ser una línea.",
    "Para categorías usa solo uno de estos slugs cuando corresponda: " +
      categoryPrompt +
      ". Si no estás seguro, usa null.",
    "Para payment_method_guess usa solo uno de estos slugs si el medio de pago está explícitamente impreso: " +
      paymentPrompt +
      ". Si no es visible, usa null.",
    "Devuelve currency como código ISO de 3 letras; para soles peruanos usa PEN.",
    "issued_at debe ser ISO 8601 o YYYY-MM-DD si la fecha es legible.",
    "Los importes deben ser números positivos y respetar exactamente los decimales impresos.",
    "Antes de responder, verifica que total_amount corresponda al total final cobrado y no al subtotal.",
  ].join("\n");

  let extraction: any;

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const interaction = await ai.interactions.create({
      model: MODEL,
      input: [
        { type: "text", text: prompt },
        {
          type: "image",
          data: base64Image,
          mime_type: mimeType,
          resolution: "high",
        },
      ],
      generation_config: {
        thinking_level: "low",
      },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema,
      },
    });

    const outputText = interaction.output_text;

    if (!outputText) {
      throw new Error("Gemini no devolvió datos estructurados.");
    }

    extraction = JSON.parse(outputText);
  } catch (error: any) {
    await supabase
      .from("receipts")
      .update({
        status: "error",
        extracted_data: {
          provider: "google-gemini",
          model: MODEL,
          error: error?.message ?? "Error de análisis",
          failed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", receiptId)
      .eq("created_by", user.id);

    return json(
      {
        error:
          error?.message ??
          "Gemini no pudo analizar el comprobante.",
      },
      502,
    );
  }

  const paymentGuess =
    typeof extraction.payment_method_guess === "string" &&
    payments.some(
      (item) => item.slug === extraction.payment_method_guess,
    )
      ? extraction.payment_method_guess
      : null;

  const normalizedItems = Array.isArray(extraction.items)
    ? extraction.items
        .filter(
          (item: any) =>
            typeof item?.description === "string" &&
            item.description.trim(),
        )
        .slice(0, 120)
        .map((item: any, index: number) => ({
          receipt_id: receiptId,
          line_number: index + 1,
          description: item.description.trim(),
          quantity:
            typeof item.quantity === "number"
              ? item.quantity
              : null,
          unit_price:
            typeof item.unit_price === "number"
              ? item.unit_price
              : null,
          line_total:
            typeof item.line_total === "number"
              ? item.line_total
              : null,
          category:
            typeof item.category === "string" &&
            categories.some(
              (category) => category.slug === item.category,
            )
              ? item.category
              : null,
          confidence:
            typeof item.confidence === "number"
              ? Math.max(0, Math.min(1, item.confidence))
              : null,
        }))
    : [];

  const { error: updateError } = await supabase
    .from("receipts")
    .update({
      merchant_name: extraction.merchant_name ?? null,
      merchant_tax_id: extraction.merchant_tax_id ?? null,
      document_type: extraction.document_type ?? null,
      document_number: extraction.document_number ?? null,
      issued_at: normalizeIssuedAt(extraction.issued_at),
      subtotal:
        typeof extraction.subtotal === "number"
          ? extraction.subtotal
          : null,
      tax_amount:
        typeof extraction.tax_amount === "number"
          ? extraction.tax_amount
          : null,
      discount_amount:
        typeof extraction.discount_amount === "number"
          ? extraction.discount_amount
          : null,
      total_amount:
        typeof extraction.total_amount === "number"
          ? extraction.total_amount
          : null,
      currency:
        typeof extraction.currency === "string" &&
        extraction.currency.length === 3
          ? extraction.currency.toUpperCase()
          : "PEN",
      payment_method: paymentGuess,
      status: "pendiente_revision",
      extracted_data: {
        provider: "google-gemini",
        model: MODEL,
        extracted_at: new Date().toISOString(),
        confidence:
          typeof extraction.confidence === "number"
            ? Math.max(0, Math.min(1, extraction.confidence))
            : null,
        result: extraction,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", receiptId)
    .eq("created_by", user.id);

  if (updateError) {
    return json({ error: updateError.message }, 500);
  }

  const { error: deleteError } = await supabase
    .from("receipt_items")
    .delete()
    .eq("receipt_id", receiptId);

  if (deleteError) {
    return json({ error: deleteError.message }, 500);
  }

  if (normalizedItems.length) {
    const { error: itemsError } = await supabase
      .from("receipt_items")
      .insert(normalizedItems);

    if (itemsError) {
      return json({ error: itemsError.message }, 500);
    }
  }

  return json({
    ok: true,
    receiptId,
    provider: "google-gemini",
    model: MODEL,
    itemCount: normalizedItems.length,
    confidence:
      typeof extraction.confidence === "number"
        ? extraction.confidence
        : null,
  });
});
