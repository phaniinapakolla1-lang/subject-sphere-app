import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCreate, useList, useOne, useUpdate } from "@/lib/data";
import { PRIORITIES, DIFFICULTIES, nextRevisionDate } from "@/lib/topic-schema";
import { legacyToBlocks, type BlockKind, type TopicBlock } from "@/lib/blocks";
import { TopicReader } from "@/components/topic-reader";

import {
  categoryLabel,
  sectionsToBlockDrafts,
  titleCase,
  type BlockDraft,
  type ParsedSection,
} from "@/lib/smart-paste";
import { SmartPasteDialog, type SaveMode } from "@/components/smart-paste-dialog";
import { BlockEditor } from "@/components/block-editor";
import { ResourceManager } from "@/components/resource-manager";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/topics/$topicId")({
  head: () => ({
    meta: [
      { title: "Topic editor — Subject Sphere" },
      { name: "description", content: "Build topic content from flexible blocks." },
      { property: "og:title", content: "Topic editor — Subject Sphere" },
      {
        property: "og:description",
        content: "Text, images, tables, code, formulas and questions.",
      },
    ],
  }),
  component: TopicEditor,
});

function TopicEditor() {
  const { topicId } = Route.useParams();
  const { user, isAdmin, demo } = useAuth();
  const topic = useOne("topics", topicId);
  const update = useUpdate("topics", { silent: true });
  const createBlock = useCreate("topic_blocks");
  const blocks = useList("topic_blocks", {
    key: ["of-topic", topicId],
    build: (q) => q.eq("topic_id", topicId).order("position", { ascending: true }),
  });
  const subject = useOne("subjects", topic.data?.subject_id);
  const unit = useOne("units", topic.data?.unit_id);
  const [mode, setMode] = useState<"read" | "edit">("read");


  const [title, setTitle] = useState("");
  const [smartOpen, setSmartOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (topic.data && !loaded.current) {
      setTitle(topic.data.title);
      loaded.current = true;
    }
  }, [topic.data]);

  const t = topic.data;
  const legacy = (t?.content ?? {}) as Record<string, unknown>;
  const legacyEntries = Object.entries(legacy).filter(([, v]) => typeof v === "string" && v.trim());
  const blockCount = blocks.data?.length ?? 0;

  function patch(values: Record<string, unknown>) {
    update.mutate({ id: topicId, values });
  }

  async function importLegacy() {
    if (!user || !t) return;
    setMigrating(true);
    try {
      const drafts = legacyToBlocks(legacy as Record<string, string>, (k) =>
        categoryLabel(k) === k ? titleCase(k) : categoryLabel(k),
      );
      for (let i = 0; i < drafts.length; i += 1) {
        const d = drafts[i] as { type: BlockKind; title: string; body: string };
        await createBlock.mutateAsync({
          user_id: user.id,
          topic_id: topicId,
          subject_id: t.subject_id,
          type: d.type,
          title: d.title,
          body: d.body,
          position: blockCount + 1 + i,
        });
      }
      patch({ content: {} });
      toast.success("Older notes converted into blocks");
    } catch {
      toast.error("Could not convert the older notes");
    } finally {
      setMigrating(false);
    }
  }

  async function saveSmartPaste(sections: ParsedSection[], mode: SaveMode) {
    if (!user || !t) return;
    const drafts = sectionsToBlockDrafts(sections);
    const base = mode === "replace" ? 0 : blockCount;
    for (let i = 0; i < drafts.length; i += 1) {
      const d = drafts[i] as BlockDraft;
      if (!d.body.trim()) continue;
      await createBlock.mutateAsync({
        user_id: user.id,
        topic_id: topicId,
        subject_id: t.subject_id,
        type: d.type,
        title: d.title,
        body: d.body,
        position: base + i + 1,
      });
    }
    toast.success(`${drafts.length} blocks added`);
  }

  function markRevised() {
    if (!t) return;
    const count = (t.revision_count ?? 0) + 1;
    patch({
      revision_count: count,
      last_revised_at: new Date().toISOString(),
      next_revision_at: nextRevisionDate(count),
    });
    toast.success("Revision logged");
  }

  if (topic.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!t) {
    return (
      <div className="panel p-10 text-center">
        <p className="text-sm text-muted-foreground">This topic could not be found.</p>
      </div>
    );
  }

  const canEdit = isAdmin || demo || (!!user && t.user_id === user.id);
  const modeSwitch = canEdit ? (
    <div className="inline-flex overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setMode("read")}
        className={`px-3 py-1.5 text-xs font-medium ${mode === "read" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}
      >
        📖 Read
      </button>
      <button
        type="button"
        onClick={() => setMode("edit")}
        className={`px-3 py-1.5 text-xs font-medium ${mode === "edit" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}
      >
        ✏️ Edit
      </button>
    </div>
  ) : null;

  if (mode === "read" || !canEdit) {
    return (
      <TopicReader
        topic={t}
        blocks={(blocks.data ?? []) as TopicBlock[]}
        subjectName={subject.data?.name}
        unitName={unit.data?.name}
        bookmarked={!!t.bookmarked}
        onToggleBookmark={() => patch({ bookmarked: !t.bookmarked })}
        actions={modeSwitch}
      />
    );
  }

  return (
    <div className="animate-rise mx-auto w-full max-w-[1080px]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/subjects/$subjectId"
          params={{ subjectId: t.subject_id }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to course
        </Link>
        {modeSwitch}
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== t.title && patch({ title: title.trim() })}
        className="mb-4 h-auto border-none bg-transparent px-0 text-2xl font-semibold tracking-tight focus-visible:ring-0"
        aria-label="Topic title"
      />
      <PageHeader
        title="Topic content"
        subtitle="Build this topic from flexible content blocks."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSmartOpen(true)}>
              <Sparkles className="size-4" /> Paste &amp; auto-organize
            </Button>
            <Button variant="outline" onClick={markRevised}>
              <RefreshCw className="size-4" /> Mark revised
            </Button>
            <Button
              variant={t.completed ? "secondary" : "default"}
              onClick={() => patch({ completed: !t.completed })}
            >
              <CheckCircle2 className="size-4" /> {t.completed ? "Completed" : "Mark complete"}
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Toggle
          active={!!t.favorite}
          onClick={() => patch({ favorite: !t.favorite })}
          icon={<Star className="size-3.5" />}
          label="Favorite"
        />
        <Toggle
          active={!!t.bookmarked}
          onClick={() => patch({ bookmarked: !t.bookmarked })}
          icon={<Bookmark className="size-3.5" />}
          label="Bookmark"
        />
        <Toggle
          active={!!t.weak}
          onClick={() => patch({ weak: !t.weak })}
          icon={<TriangleAlert className="size-3.5" />}
          label="Weak area"
        />
        {t.revision_count > 0 && <Badge variant="secondary">{t.revision_count} revisions</Badge>}
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4 space-y-4">
          {legacyEntries.length > 0 && (
            <div className="panel flex flex-wrap items-center gap-3 border-warning/40 p-4">
              <p className="text-sm text-muted-foreground">
                This topic has {legacyEntries.length} sections saved in the older format.
              </p>
              <Button size="sm" variant="outline" onClick={importLegacy} disabled={migrating}>
                {migrating ? <Loader2 className="size-4 animate-spin" /> : null}
                Convert to blocks
              </Button>
            </div>
          )}
          <BlockEditor topicId={topicId} subjectId={t.subject_id} userId={user?.id} />
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <div className="panel grid gap-4 p-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={t.priority} onValueChange={(v) => patch({ priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {titleCase(p)}
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
                      {titleCase(d)}
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
                onBlur={(e) => patch({ estimated_minutes: Number(e.target.value) || 30 })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <div className="panel p-5">
            <ResourceManager topicId={topicId} />
          </div>
        </TabsContent>
      </Tabs>

      <SmartPasteDialog
        open={smartOpen}
        onOpenChange={setSmartOpen}
        onSave={saveSmartPaste}
        hasExistingContent={blockCount > 0}
      />
    </div>
  );
}

function Toggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button variant={active ? "secondary" : "ghost"} size="sm" onClick={onClick}>
      {icon} {label}
    </Button>
  );
}
