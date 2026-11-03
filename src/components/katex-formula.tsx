/**
 * KaTeX-powered formula rendering + editing.
 * Rendering never crashes the app: invalid LaTeX shows the source with a
 * parse-error hint instead. Works in the editor, the preview and Read Mode.
 */
import { useMemo, useRef, useState } from "react";
import katex from "katex";
import { Check, Copy, Eye, Sigma } from "lucide-react";
import "katex/dist/katex.min.css";
import { SYMBOL_GROUPS } from "@/lib/formula-toolbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type FormulaMode = "display" | "inline";

export function renderFormula(
  latex: string,
  displayMode: boolean,
): { html: string; error: string | null } {
  if (!latex.trim()) return { html: "", error: null };
  try {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: true,
      strict: false,
      trust: false,
      output: "html",
    });
    return { html, error: null };
  } catch (e) {
    return {
      html: "",
      error: e instanceof Error ? e.message.replace(/^KaTeX parse error:\s*/, "") : "Invalid LaTeX",
    };
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Read-only rendered formula. */
export function FormulaView({
  latex,
  mode = "display",
  className,
}: {
  latex: string;
  mode?: FormulaMode;
  className?: string;
}) {
  const { html, error } = useMemo(() => renderFormula(latex, mode === "display"), [latex, mode]);
  if (!latex.trim()) return null;
  if (error)
    return (
      <div className={cn("overflow-x-auto text-sm", className)}>
        <p className="mb-1 flex items-center gap-1.5 text-xs text-destructive">
          <Sigma className="size-3.5 shrink-0" /> Formula could not be rendered: {error}
        </p>
        <pre className="overflow-x-auto rounded-md bg-muted/60 p-2 text-xs">
          <code>{latex}</code>
        </pre>
      </div>
    );
  return (
    <div
      className={cn(
        "katex-wrap overflow-x-auto py-1",
        mode === "inline" ? "text-left" : "text-center",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Editing surface: LaTeX source, live preview, symbol toolbar, mode toggle. */
export function FormulaEditor({
  value,
  mode,
  onChange,
  onModeChange,
}: {
  value: string;
  mode: FormulaMode;
  onChange: (next: string) => void;
  onModeChange: (mode: FormulaMode) => void;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [group, setGroup] = useState(SYMBOL_GROUPS[0]?.key ?? "basic");
  const [copied, setCopied] = useState(false);
  const { html, error } = useMemo(() => renderFormula(value, mode === "display"), [value, mode]);

  function insert(snippet: string) {
    const el = areaRef.current;
    const placeholder = "$$";
    if (!el) {
      onChange(value + snippet);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const insertText = snippet.includes(placeholder)
      ? snippet.replace(placeholder, selected)
      : snippet;
    const next = value.slice(0, start) + insertText + value.slice(end);
    onChange(next);
    const cursor = start + insertText.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  async function copyLatex() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const items = SYMBOL_GROUPS.find((g) => g.key === group)?.items ?? [];

  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-background/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">LaTeX source</Label>
        <div className="ml-auto flex items-center gap-1">
          <div className="inline-flex overflow-hidden rounded-md border border-border text-xs">
            <button
              type="button"
              aria-pressed={mode === "display"}
              onClick={() => onModeChange("display")}
              className={cn(
                "px-2 py-1 transition-colors",
                mode === "display" ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
              )}
            >
              Display
            </button>
            <button
              type="button"
              aria-pressed={mode === "inline"}
              onClick={() => onModeChange("inline")}
              className={cn(
                "px-2 py-1 transition-colors",
                mode === "inline" ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
              )}
            >
              Inline
            </button>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={copyLatex} disabled={!value.trim()}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy LaTeX"}
          </Button>
        </div>
      </div>

      <Textarea
        ref={areaRef}
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        placeholder="\\frac{a}{b}  \\sqrt{x}  \\sum_{i=1}^{n} x_i"
        className="font-mono text-xs"
        spellCheck={false}
      />

      {value.trim() && (
        <div
          className={cn(
            "overflow-x-auto rounded-md border border-border/60 bg-card/50 p-3",
            error && "border-destructive/40",
          )}
        >
          {error ? (
            <p className="text-xs text-destructive">⚠ {error}</p>
          ) : (
            <div
              className={cn("katex-wrap", mode === "inline" ? "text-left" : "text-center")}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {SYMBOL_GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(g.key)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] transition-colors",
                group === g.key
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              title={item.label}
              onClick={() => insert(item.latex)}
              className="rounded-md border border-border/60 bg-card/60 px-1.5 py-0.5 text-xs transition-colors hover:bg-accent"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Eye className="size-3" /> Preview updates as you type. The original LaTeX is preserved
        when saving.
      </p>
    </div>
  );
}
