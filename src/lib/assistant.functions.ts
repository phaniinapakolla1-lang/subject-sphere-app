import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Msg = { role: "user" | "assistant"; content: string };

// Signed-in students only — the AI gateway key must never serve anonymous callers.
export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: Msg[] }) => input)
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "You are StudyOS Assistant, a concise study coach. Explain concepts clearly, give exam-ready answers, generate MCQs, flashcards and summaries when asked. Use markdown.",
          },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (!res.ok) throw new Error("The assistant could not respond right now.");

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { reply: json.choices?.[0]?.message?.content ?? "No response." };
  });
