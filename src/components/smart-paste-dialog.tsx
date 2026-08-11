import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ClipboardPaste,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIES,
  categoryEmoji,
  categoryLabel,
  cleanFormatting,
  confidenceLabel,
  mergeSameCategory,
  newSectionId,
  parseSmartPaste,
  type ParsedSection,
} from "@/lib/smart-paste";
import { organizePastedText } from "@/lib/smart-paste.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SaveMode = "replace" | "append";

export function SmartPasteDialog({
  open,
  onOpenChange,
  onSave,
  hasExistingContent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (sections: ParsedSection[], mode: SaveMode) => Promise<void> | void;
  hasExistingContent: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [step, setStep] = useState<"input" | "loading" | "preview" | "error">("input");

  const [text, setText] = useState("");
  const [sections, setSections] = useState<ParsedSection[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<SaveMode>(hasExistingContent ? "append" : "replace");
  const [saving, setSaving] = useState(false);

  function reset() {
    setStep("input");
    setText("");
    setSections([]);
    setError("");
    setProgress(0);
  }

  function close(v: boolean) {
    onOpenChange(v);
    if (!v) setTimeout(reset, 200);
  }

  function fallbackToManualPaste(message: string) {
    toast.info(message);
    textareaRef.current?.focus();
  }

  async function pasteFromClipboard() {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
      fallbackToManualPaste("Your browser can't read the clipboard — press Ctrl+V (⌘V) here.");
      return;
    }
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        fallbackToManualPaste("Your clipboard is empty — press Ctrl+V (⌘V) here instead.");
        return;
      }
      setText((t) => (t ? `${t}\n${clip}` : clip));
      textareaRef.current?.focus();
    } catch {
      fallbackToManualPaste("Clipboard access was blocked — press Ctrl+V (⌘V) here instead.");
    }
  }


  async function analyze(enhance = false) {
    if (!text.trim()) {
      toast.info("Paste some text first.");
      return;
    }
    setStep("loading");
    setError("");
    setProgress(15);
    const tick = setInterval(() => setProgress((p) => Math.min(90, p + 7)), 250);
    try {
      const result = await organizePastedText({ data: { text, enhance } });
      const mapped = mergeSameCategory(
        result.sections.map((s) => ({
          id: newSectionId(),
          category: s.type,
          title: s.title || categoryLabel(s.type),
          content: s.content,
          confidence: s.confidence,
        })),
      );
      setSections(mapped);
      setStep("preview");
    } catch (e) {
      const local = parseSmartPaste(text);
      if (local.length) {
        setSections(local);
        setStep("preview");
        toast.info("Organized offline — AI was unavailable, please review the sections.");
      } else {
        setError(
          e instanceof Error ? e.message : "Something went wrong while organizing this content.",
        );
        setStep("error");
      }
    } finally {
      clearInterval(tick);
      setProgress(100);
    }
  }

  function organizeLocally() {
    const local = parseSmartPaste(text);
    if (!local.length) {
      toast.info("Nothing to organize in that text.");
      return;
    }
    setSections(local);
    setStep("preview");
  }

  function patch(id: string, values: Partial<ParsedSection>) {
    setSections((list) => list.map((s) => (s.id === id ? { ...s, ...values } : s)));
  }

  function move(id: string, dir: -1 | 1) {
    setSections((list) => {
      const i = list.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      const a = next[i]!;
      const b = next[j]!;
      next[i] = b;
      next[j] = a;
      return next;
    });
  }

  function mergeUp(id: string) {
    setSections((list) => {
      const i = list.findIndex((s) => s.id === id);
      if (i <= 0) return list;
      const prev = list[i - 1]!;
      const cur = list[i]!;
      const next = [...list];
      next[i - 1] = { ...prev, content: `${prev.content}\n${cur.content}`.trim() };
      next.splice(i, 1);
      return next;
    });
  }

  function splitSection(id: string) {
    setSections((list) => {
      const i = list.findIndex((s) => s.id === id);
      if (i < 0) return list;
      const cur = list[i]!;
      const parts = cur.content.split(/\n{2,}/).filter((p) => p.trim());
      if (parts.length < 2) {
        toast.info("Add a blank line where you want to split this section.");
        return list;
      }
      const next = [...list];
      next.splice(i, 1, ...parts.map((p) => ({ ...cur, id: newSectionId(), content: p.trim() })));
      return next;
    });
  }

  function addSection() {
    setSections((list) => [
      ...list,
      {
        id: newSectionId(),
        category: "uncategorized",
        title: "Custom section",
        content: "",
        confidence: 1,
      },
    ]);
  }

  async function save() {
    const usable = sections.filter((s) => s.content.trim());
    if (!usable.length) {
      toast.info("Nothing to save yet.");
      return;
    }
    setSaving(true);
    try {
      await onSave(usable, mode);
      close(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Smart Paste
          </DialogTitle>
          <DialogDescription>
            Paste copied text here. Subject Sphere will automatically identify definitions,
            headings, advantages, disadvantages, examples, features and applications.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={pasteFromClipboard}>
                <ClipboardPaste className="size-4" /> Paste from clipboard
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setText((t) => cleanFormatting(t))}
                disabled={!text.trim()}
              >
                🧹 Clean formatting
              </Button>
            </div>
            <Textarea
              autoFocus
              rows={14}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your study material…"
              className="min-h-[240px] w-full font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {text.trim().length.toLocaleString()} characters
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={organizeLocally} disabled={!text.trim()}>
                Organize without AI
              </Button>
              <Button onClick={() => analyze(false)} disabled={!text.trim()}>
                <Sparkles className="size-4" /> Analyze &amp; organize
              </Button>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="space-y-4 py-10 text-center">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Analyzing your content…</p>
            <Progress value={progress} className="mx-auto h-2 max-w-sm" />
            <p className="text-xs text-muted-foreground">
              Detecting headings, lists and categories.
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 py-8 text-center">
            <TriangleAlert className="mx-auto size-6 text-destructive" />
            <p className="text-sm">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => analyze(false)}>Try again</Button>
              <Button variant="outline" onClick={() => setStep("input")}>
                Edit manually
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" /> Auto-organized content
                <Badge variant="secondary">{sections.length} sections</Badge>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSections((list) =>
                    list.map((s) => ({ ...s, content: cleanFormatting(s.content) })),
                  )
                }
              >
                🧹 Clean formatting
              </Button>
            </div>

            <div className="space-y-3">
              {sections.map((s, i) => (
                <SectionCard
                  key={s.id}
                  section={s}
                  first={i === 0}
                  last={i === sections.length - 1}
                  onChange={(v) => patch(s.id, v)}
                  onDelete={() => setSections((l) => l.filter((x) => x.id !== s.id))}
                  onMove={(d) => move(s.id, d)}
                  onMergeUp={() => mergeUp(s.id)}
                  onSplit={() => splitSection(s.id)}
                />
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addSection} className="w-full sm:w-auto">
              <Plus className="size-4" /> Add section
            </Button>

            {hasExistingContent && (
              <div className="panel space-y-2 p-4">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  This topic already has content
                </Label>
                <Select value={mode} onValueChange={(v) => setMode(v as SaveMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="append">Add below existing content</SelectItem>
                    <SelectItem value="replace">Replace matching sections</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep("input")}>
                <ArrowLeft className="size-4" /> Edit raw text
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => analyze(true)}>
                  <Wand2 className="size-4" /> Enhance with AI
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />} Save to topic
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionCard({
  section,
  first,
  last,
  onChange,
  onDelete,
  onMove,
  onMergeUp,
  onSplit,
}: {
  section: ParsedSection;
  first: boolean;
  last: boolean;
  onChange: (v: Partial<ParsedSection>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onMergeUp: () => void;
  onSplit: () => void;
}) {
  const uncategorized = section.category === "uncategorized";
  return (
    <div className={cn("panel space-y-3 p-4", uncategorized && "border-warning/40 bg-warning/5")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base">{categoryEmoji(section.category)}</span>
        <Input
          value={section.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-8 max-w-[220px] flex-1 border-0 bg-transparent px-0 text-sm font-semibold uppercase tracking-wide shadow-none focus-visible:ring-0"
          aria-label="Section title"
        />
        <span
          className={cn(
            "hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex",
            section.confidence >= 0.8 && "text-success",
            section.confidence < 0.5 && "text-warning",
          )}
        >
          ● {confidenceLabel(section.confidence)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Move up"
            disabled={first}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Move down"
            disabled={last}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete section"
            onClick={onDelete}
            className="text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {uncategorized && (
        <p className="text-xs text-warning">
          ⚠ This content could not be confidently classified — choose a category.
        </p>
      )}

      <Textarea
        rows={Math.min(12, Math.max(3, section.content.split("\n").length + 1))}
        value={section.content}
        onChange={(e) => onChange({ content: e.target.value })}
        className="resize-y text-sm"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={section.category}
          onValueChange={(v) =>
            onChange({
              category: v,
              title: v === "uncategorized" ? section.title : categoryLabel(v),
              confidence: 1,
            })
          }
        >
          <SelectTrigger className="h-8 w-full sm:w-56">
            <SelectValue placeholder="Choose category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={onMergeUp} disabled={first}>
          Merge up
        </Button>
        <Button variant="ghost" size="sm" onClick={onSplit}>
          Split
        </Button>
      </div>
    </div>
  );
}
