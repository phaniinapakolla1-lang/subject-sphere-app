import { createServerFn } from "@tanstack/react-start";
import { CATEGORIES } from "@/lib/smart-paste";

const MAX_INPUT = 24000;

type AiSection = { type: string; title: string; content: string; confidence: number };

export const organizePastedText = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string; enhance?: boolean }) => {
    const text = String(input?.text ?? "")
      .slice(0, MAX_INPUT)
      .trim();
    if (!text) throw new Error("Paste some text first.");
    return { text, enhance: Boolean(input?.enhance) };
  })
  .handler(async ({ data }): Promise<{ sections: AiSection[] }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const allowed = CATEGORIES.map((c) => c.key).join(", ");

    const system = [
      "You organize pasted academic study material into structured sections.",
      "Rules:",
      "- NEVER invent facts. Only classify, split, and clean the text you are given.",
      "- Preserve existing headings and their content when the text already has them.",
      "- When there are no headings, infer the category from meaning.",
      "- Clean formatting only: trim spaces, fix broken line breaks, normalize bullets to '- ' and numbered lists to '1. '.",
      "- If you are not confident about a category, use 'uncategorized' instead of guessing.",
      `- 'type' MUST be one of: ${allowed}.`,
      "- 'title' is a short human label for the section.",
      "- 'content' is markdown text (use '- ' bullets or '1. ' numbering where the source is a list).",
      "- confidence is 0..1.",
      data.enhance
        ? "- ENHANCE MODE: you may add brief clarifying wording, but keep all original facts."
        : "- Do not add any information that is not present in the source text.",
      'Respond ONLY with JSON: {"sections":[{"type":"...","title":"...","content":"...","confidence":0.9}]}',
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.text },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (!res.ok) throw new Error("The organizer could not analyze this text right now.");

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim());
    } catch {
      throw new Error("The organizer returned an unreadable response.");
    }

    const list = (parsed as { sections?: unknown })?.sections;
    if (!Array.isArray(list)) throw new Error("The organizer returned no sections.");

    const validKeys = new Set(CATEGORIES.map((c) => c.key));
    const sections: AiSection[] = [];
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const content = Array.isArray(rec["content"])
        ? (rec["content"] as unknown[]).map((l) => `- ${String(l).trim()}`).join("\n")
        : String(rec["content"] ?? "").trim();
      if (!content) continue;
      const type = String(rec["type"] ?? "")
        .toLowerCase()
        .trim();
      const confidence = Number(rec["confidence"]);
      sections.push({
        type: validKeys.has(type) ? type : "uncategorized",
        title:
          String(rec["title"] ?? "")
            .trim()
            .slice(0, 80) || "Section",
        content: content.slice(0, 20000),
        confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0.5,
      });
    }

    if (!sections.length) throw new Error("Nothing could be organized from this text.");
    return { sections };
  });
