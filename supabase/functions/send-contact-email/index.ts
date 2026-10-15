const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedSubjects = new Set([
  "Consulta general",
  "Soporte de SFIQ",
  "Privacidad y datos",
  "Corrección de contenido",
  "Publicidad y colaboraciones",
]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método no permitido." }, 405);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const contactEmail = Deno.env.get("CONTACT_EMAIL");

  if (!resendApiKey || !contactEmail) {
    return json(
      {
        error: "El canal de contacto no está configurado.",
        code: "CONTACT_NOT_CONFIGURED",
      },
      503,
    );
  }

  let body: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    source?: string;
    website?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Solicitud inválida." }, 400);
  }

  if (cleanText(body.website, 200)) {
    return json({ ok: true });
  }

  const name = cleanText(body.name, 100);
  const email = cleanText(body.email, 254).toLowerCase();
  const rawSubject = cleanText(body.subject, 80);
  const subject = allowedSubjects.has(rawSubject) ? rawSubject : "Consulta general";
  const message = cleanText(body.message, 4000);
  const source = cleanText(body.source, 20) === "mobile" ? "App móvil" : "Web";

  if (!validEmail(email)) {
    return json({ error: "Correo inválido." }, 400);
  }

  if (message.length < 10) {
    return json({ error: "El mensaje es demasiado corto." }, 400);
  }

  const safeName = escapeHtml(name || "Sin nombre");
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br>");
  const safeSource = escapeHtml(source);

  const html =
    '<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#172033">' +
      '<div style="background:#081426;color:#fff;padding:22px 24px;border-radius:16px 16px 0 0">' +
        '<div style="font-size:12px;letter-spacing:1px;color:#80b7ff;font-weight:700">SFIQ · CONTACTO</div>' +
        '<h1 style="font-size:22px;margin:8px 0 0">Nueva consulta recibida</h1>' +
      '</div>' +
      '<div style="border:1px solid #dbe4f0;border-top:0;padding:24px;border-radius:0 0 16px 16px">' +
        '<p><strong>Nombre:</strong> ' + safeName + '</p>' +
        '<p><strong>Correo:</strong> ' + safeEmail + '</p>' +
        '<p><strong>Motivo:</strong> ' + safeSubject + '</p>' +
        '<p><strong>Origen:</strong> ' + safeSource + '</p>' +
        '<hr style="border:0;border-top:1px solid #e6edf5;margin:20px 0">' +
        '<p style="font-weight:700;margin-bottom:8px">Mensaje</p>' +
        '<div style="line-height:1.6">' + safeMessage + '</div>' +
        '<p style="margin-top:24px;font-size:12px;color:#66758a">Responde este correo directamente para contestar a ' + safeEmail + '.</p>' +
      '</div>' +
    '</div>';

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + resendApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SFIQ Contacto <contacto@sfiq.app>",
      to: [contactEmail],
      reply_to: email,
      subject: "[SFIQ] " + subject,
      html,
      text: [
        "SFIQ - Nueva consulta",
        "",
        "Nombre: " + (name || "Sin nombre"),
        "Correo: " + email,
        "Motivo: " + subject,
        "Origen: " + source,
        "",
        message,
      ].join("\n"),
    }),
  });

  const resendData = await resendResponse.json().catch(() => null);

  if (!resendResponse.ok) {
    console.error("Resend error", resendResponse.status, resendData);
    return json(
      {
        error: "No se pudo enviar el mensaje. Inténtalo nuevamente en unos minutos.",
        code: "RESEND_ERROR",
      },
      502,
    );
  }

  return json({ ok: true, id: resendData?.id ?? null });
});
