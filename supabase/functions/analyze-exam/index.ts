import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { fileBase64, mimeType, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!fileBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: "Falta el archivo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Eres un asistente médico empático que traduce resultados de exámenes médicos a un lenguaje claro, humano y comprensible para personas sin formación médica.

REGLAS:
- Habla en español, con calidez y cercanía.
- Estructura tu respuesta en secciones con títulos en markdown:
  ## 📋 Resumen general
  ## 🔍 Hallazgos principales
  ## ✅ Lo que está bien
  ## ⚠️ Lo que conviene revisar
  ## 💡 Recomendaciones
  ## 🩺 Próximos pasos
- Evita tecnicismos; cuando uses uno, explícalo entre paréntesis.
- NO diagnostiques. Siempre recuerda al final consultar con un profesional de la salud.
- Sé breve, claro y humano.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Por favor analiza este examen médico (${fileName ?? "archivo"}) y explícamelo de forma clara y humana.` },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se agotaron los créditos de IA. Agrega créditos en tu workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Error en el análisis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-exam error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
