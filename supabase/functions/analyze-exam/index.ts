const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const { fileBase64, mimeType, fileName, text, history } = await req.json();

    if (!fileBase64 && !text) {
      return new Response(JSON.stringify({ error: "Falta el mensaje o archivo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Eres un asistente médico especializado exclusivamente en análisis de exámenes médicos. Tu único propósito es analizar y explicar resultados de exámenes médicos.

INSTRUCCIONES ESTRICTAS:
- Solo puedes responder preguntas relacionadas con exámenes médicos, resultados clínicos, análisis de laboratorio, estudios de imagen y temas de salud médica.
- NO respondas a ninguna pregunta que no esté relacionada con medicina o salud. Esto incluye preguntas sobre cultura pop, historia, programación, entretenimiento, deportes, o cualquier tema no médico.
- Si la pregunta no es sobre exámenes médicos o salud, responde ÚNICAMENTE con: "Lo siento, solo puedo ayudar con análisis de exámenes médicos."
- No des explicaciones adicionales ni converses sobre temas no médicos.
- Habla siempre en español.
- Cuando analices un examen, estructura tu respuesta en secciones claras:
  ## Resumen general
  ## Hallazgos principales
  ## Lo que está bien
  ## Lo que conviene revisar
  ## Recomendaciones
  ## Próximos pasos
- Evita tecnicismos innecesarios; si usas uno, explícalo entre paréntesis.
- NO emitas diagnósticos definitivos. Indica que siempre se debe confirmar con un profesional médico.`;

    const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
    const userText = fileBase64
      ? (text?.trim() || `Por favor analiza este examen médico (${fileName ?? "archivo"}) y explícamelo de forma clara y humana.`)
      : text;
    userContent.push({ type: "text", text: userText });
    if (fileBase64 && mimeType) {
      userContent.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } });
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: userContent },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
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
    const rawResult = data.choices?.[0]?.message?.content ?? "";
    const normalizedResult = rawResult.trim();
    const outOfScopePattern = /no puedo responder|no puedo ayudar|no estoy autorizado|solo puedo analizar exámenes médicos|fuera de mi ámbito|no es mi propósito|lo siento, solo puedo ayudar con análisis de exámenes médicos/i;
    const medicalKeywords = /examen|análisis|laboratorio|diagnóstico|salud|médico|paciente|clínico|resultado|prueba|sangre|orina|radiografía|ecografía|tomografía|resonancia|biopsia|biometría|hemograma|glucosa|colesterol|triglicéridos|presión|cardiaca|pulmonar|renal|hepático/i;
    const isOutOfScope = outOfScopePattern.test(normalizedResult) || (!medicalKeywords.test(normalizedResult) && normalizedResult !== "");
    const result = isOutOfScope
      ? "Lo siento, solo puedo ayudar con análisis de exámenes médicos."
      : normalizedResult || "No se obtuvo respuesta válida del servicio de IA.";

    return new Response(JSON.stringify({ result, isOutOfScope }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-exam error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
