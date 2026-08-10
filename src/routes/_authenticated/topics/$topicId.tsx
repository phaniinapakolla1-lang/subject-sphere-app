import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useOne, useUpdate, type Topic } from "@/lib/data";
import {
  TOPIC_FIELDS,
  TOPIC_GROUPS,
  PRIORITIES,
  DIFFICULTIES,
  nextRevisionDate,
} from "@/lib/topic-schema";
import { applySections, slug, titleCase } from "@/lib/smart-paste";
import { SmartPasteDialog } from "@/components/smart-paste-dialog";
import { renderMarkdown } from "@/lib/markdown";
import { ResourceManager } from "@/components/resource-manager";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/topics/$topicId")({
  head: () => ({
    meta: [
      { title: "Topic editor — StudyOS" },
      { name: "description", content: "Write structured study content for this topic." },
      { property: "og:title", content: "Topic editor — StudyOS" },
      { property: "og:description", content: "Definition, explanation, answers, MCQs and more." },
    ],
  }),
  component: TopicEditor,
});

type Content = Record<string, string>;

function TopicEditor() {
  const { topicId } = Route.useParams();
  const topic = useOne("topics", topicId);
  const update = useUpdate("topics", { silent: true });

  const [content, setContent] = useState<Content>({});
  const [title, setTitle] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const loaded = useRef(false);

  const knownKeys = useMemo(() => new Set(TOPIC_FIELDS.map((f) => f.key)), []);
  const customKeys = useMemo(
    () => Object.keys(content).filter((k) => !knownKeys.has(k)),
    [content, knownKeys],
  );

  function setField(key: string, value: string) {
    setContent((c) => ({ ...c, [key]: value }));
    setDirty(true);
  }

  function addCustomSection() {
    const name = window.prompt("Section title (e.g. Exam Points)");
    if (!name?.trim()) return;
    const key = slug(name);
    if (content[key] !== undefined) {
      toast.info("That section already exists.");
      return;
    }
    setField(key, "");
  }

  useEffect(() => {
    if (topic.data && !loaded.current) {
      loaded.current = true;
      setContent((topic.data.content ?? {}) as Content);
      setTitle(topic.data.title);
    }
  }, [topic.data]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(async () => {
      setSaving(true);
      await update.mutateAsync({ id: topicId, values: { content, title } });
      setSaving(false);
      setDirty(false);
    }, 900);
    return () => clearTimeout(t);
  }, [content, title, dirty, topicId, update]);

  const t = topic.data;

  function patch(values: Partial<Topic>) {
    update.mutate({ id: topicId, values });
  }

  function revise() {
    if (!t) return;
    const count = (t.revision_count ?? 0) + 1;
    patch({
      revision_count: count,
      last_revised_at: new Date().toISOString(),
      next_revision_at: nextRevisionDate(count),
    });
    toast.success(`Revision ${count} logged`);
  }

  function applySmartPaste(
    sections: Parameters<typeof applySections>[1],
    mode: "replace" | "append",
  ) {
    setContent((c) => applySections(c, sections, mode));
    setDirty(true);
    toast.success(`${sections.length} sections added to this topic`);
  }

  if (topic.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!t) return <p className="text-muted-foreground">Topic not found.</p>;

  return (
    <div className="animate-rise">
      <Link
        to="/subjects/$subjectId"
        params={{ subjectId: t.subject_id }}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to subject
      </Link>

      <PageHeader
        title=""
        actions={
          <>
            <span className="mr-2 text-xs text-muted-foreground">
              {saving ? "Saving…" : dirty ? "Unsaved" : "All changes saved"}
            </span>
            <Button size="sm" onClick={() => setSmartOpen(true)}>
              <Sparkles className="size-4" /> Paste &amp; auto-organize
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreview((p) => !p)}>
              {preview ? <Pencil className="size-4" /> : <Eye className="size-4" />}
              {preview ? "Edit" : "Preview"}
            </Button>

            <Button size="sm" onClick={revise}>
              <RefreshCw className="size-4" /> Log revision
            </Button>
          </>
        }
      />

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
        className="mb-4 w-full border-0 bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
        placeholder="Topic title"
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Toggle
          active={t.completed}
          onClick={() => patch({ completed: !t.completed })}
          icon={CheckCircle2}
          label="Completed"
        />
        <Toggle
          active={t.favorite}
          onClick={() => patch({ favorite: !t.favorite })}
          icon={Star}
          label="Favorite"
        />
        <Toggle
          active={t.bookmarked}
          onClick={() => patch({ bookmarked: !t.bookmarked })}
          icon={Bookmark}
          label="Bookmark"
        />
        <Toggle
          active={t.weak}
          onClick={() => patch({ weak: !t.weak })}
          icon={TriangleAlert}
          label="Weak topic"
        />
        <Badge variant="secondary">Revisions: {t.revision_count}</Badge>
        {t.next_revision_at && (
          <Badge variant="outline">
            Next revision {new Date(t.next_revision_at).toLocaleDateString()}
          </Badge>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={t.priority} onValueChange={(v) => patch({ priority: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select value={t.difficulty} onValueChange={(v) => patch({ difficulty: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estimated minutes</Label>
          <Input
            type="number"
            defaultValue={t.estimated_minutes}
            onBlur={(e) => patch({ estimated_minutes: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Previous question</Label>
          <Select
            value={t.previous_question ? "yes" : "no"}
            onValueChange={(v) => patch({ previous_question: v === "yes" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Asked before</SelectItem>
              <SelectItem value="no">Not asked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="core">
        <TabsList className="flex-wrap">
          {TOPIC_GROUPS.map((g) => (
            <TabsTrigger key={g.id} value={g.id}>
              {g.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="sections">
            Sections{customKeys.length ? ` (${customKeys.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {TOPIC_GROUPS.map((g) => (
          <TabsContent key={g.id} value={g.id} className="space-y-4">
            {TOPIC_FIELDS.filter((f) => f.group === g.id).map((f) => (
              <div key={f.key} className="panel p-4">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  {f.label}
                </Label>
                {preview ? (
                  <div
                    className="prose-studyos mt-2 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(content[f.key] ?? ""),
                    }}
                  />
                ) : (
                  <Textarea
                    className="mt-2 resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    rows={f.rows ?? 4}
                    placeholder={f.placeholder}
                    value={content[f.key] ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </TabsContent>
        ))}

        <TabsContent value="sections" className="space-y-4">
          {customKeys.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No extra sections yet. Use Smart Paste or add your own section below.
            </p>
          )}
          {customKeys.map((key) => (
            <div key={key} className="panel p-4">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  {titleCase(key.replace(/_/g, " "))}
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete section"
                  className="text-destructive"
                  onClick={() => {
                    setContent((c) => {
                      const next = { ...c };
                      delete next[key];
                      return next;
                    });
                    setDirty(true);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {preview ? (
                <div
                  className="prose-studyos mt-2 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content[key] ?? "") }}
                />
              ) : (
                <Textarea
                  className="mt-2 resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  rows={5}
                  value={content[key] ?? ""}
                  onChange={(e) => setField(key, e.target.value)}
                />
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addCustomSection}>
            <Plus className="size-4" /> Add custom section
          </Button>
        </TabsContent>

        <TabsContent value="resources">
          <ResourceManager topicId={t.id} subjectId={t.subject_id} />
        </TabsContent>
      </Tabs>

      <SmartPasteDialog
        open={smartOpen}
        onOpenChange={setSmartOpen}
        hasExistingContent={Object.values(content).some((v) => (v ?? "").trim())}
        onSave={applySmartPaste}
      />
    </div>
  );
}

function Toggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}
