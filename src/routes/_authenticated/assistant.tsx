import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { askAssistant } from "@/lib/assistant.functions";
import { renderMarkdown } from "@/lib/markdown";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — StudyOS" },
      { name: "description", content: "Ask your study coach for explanations, answers and MCQs." },
      { property: "og:title", content: "AI Assistant — StudyOS" },
      { property: "og:description", content: "Ask your study coach for explanations, answers and MCQs." },
    ],
  }),
  component: AssistantPage,
});

const PROMPTS = [
  "Explain this topic simply with an example",
  "Give me a 10-mark exam answer",
  "Create 5 MCQs with answers",
  "Summarise into flashcards",
];

type Msg = { role: "user" | "assistant"; content: string };

function AssistantPage() {
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await ask({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assistant unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-rise mx-auto flex max-w-3xl flex-col">
      <PageHeader title="AI Assistant" subtitle="Your always-on study coach" />

      <div className="panel flex min-h-[55vh] flex-col gap-4 p-5">
        {messages.length === 0 && (
          <div className="m-auto text-center">
            <Sparkles className="mx-auto size-8 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">
              Ask anything about your syllabus.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {m.role === "assistant" ? (
              <div
                className="prose-studyos leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
              />
            ) : (
              m.content
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder="Ask about any topic…"
        />
        <Button type="submit" disabled={loading}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
