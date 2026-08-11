import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCreate, useList, useRemove, useUpdate } from "@/lib/data";
import { isDemo } from "@/lib/demo";
import {
  BLOCK_TYPES,
  STANDARD_BLOCKS,
  blockDef,
  type BlockKind,
  type TopicBlock,
} from "@/lib/blocks";
import { BlockView } from "@/components/block-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Draft = { type: BlockKind; title: string; body: string };

export function BlockEditor({
  topicId,
  subjectId,
  userId,
}: {
  topicId: string;
  subjectId: string | null;
  userId: string | undefined;
}) {
  const blocks = useList("topic_blocks", {
    key: ["of-topic", topicId],
    build: (q) => q.eq("topic_id", topicId).order("position", { ascending: true }),
  });
  const create = useCreate("topic_blocks");
  const update = useUpdate("topic_blocks", { silent: true });
  const remove = useRemove("topic_blocks", "Block removed");

  const [preview, setPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const list = (blocks.data ?? []) as TopicBlock[];

  async function addBlock(draft: Draft, offset = 0) {
    if (!userId) return;
    await create.mutateAsync({
      user_id: userId,
      topic_id: topicId,
      subject_id: subjectId,
      type: draft.type,
      title: draft.title,
      body: draft.body,
      position: list.length + 1 + offset,
    });
  }

  async function insertTemplate() {
    if (!userId) return;
    setAdding(true);
    try {
      for (let i = 0; i < STANDARD_BLOCKS.length; i += 1) {
        await addBlock(STANDARD_BLOCKS[i] as Draft, i);
      }
      toast.success("Standard academic template added");
    } finally {
      setAdding(false);
    }
  }

  function move(block: TopicBlock, dir: -1 | 1) {
    const i = list.findIndex((b) => b.id === block.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const other = list[j] as TopicBlock;
    update.mutate({ id: block.id, values: { position: other.position } });
    update.mutate({ id: other.id, values: { position: block.position } });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {list.length} block{list.length === 1 ? "" : "s"}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreview((p) => !p)}>
            <Eye className="size-4" /> {preview ? "Edit" : "Preview"}
          </Button>
          <Button variant="outline" size="sm" onClick={insertTemplate} disabled={adding}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Standard template
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="space-y-4">
          {list.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nothing to preview yet.
            </p>
          ) : (
            list.map((b) => <BlockView key={b.id} block={b} />)
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((b, i) => (
            <BlockCard
              key={b.id}
              block={b}
              first={i === 0}
              last={i === list.length - 1}
              onSave={(values) => update.mutate({ id: b.id, values })}
              onMove={(dir) => move(b, dir)}
              onDelete={() => remove.mutate(b.id)}
              onDuplicate={() =>
                addBlock({ type: b.type as BlockKind, title: b.title ?? "", body: b.body ?? "" })
              }
            />
          ))}
          <AddBlockBar onAdd={(type) => addBlock({ type, title: "", body: "" })} />
        </div>
      )}
    </div>
  );
}

function AddBlockBar({ onAdd }: { onAdd: (type: BlockKind) => void }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button variant="outline" className="w-full border-dashed" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add content
      </Button>
    );
  return (
    <div className="rounded-xl border border-dashed border-border p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {BLOCK_TYPES.map((b) => (
          <button
            key={b.kind}
            type="button"
            title={b.hint}
            onClick={() => {
              onAdd(b.kind);
              setOpen(false);
            }}
            className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 text-xs transition-colors hover:bg-accent"
          >
            <span aria-hidden className="text-base">
              {b.emoji}
            </span>
            {b.label}
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}

function BlockCard({
  block,
  first,
  last,
  onSave,
  onMove,
  onDelete,
  onDuplicate,
}: {
  block: TopicBlock;
  first: boolean;
  last: boolean;
  onSave: (values: Partial<TopicBlock>) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const def = blockDef(block.type);
  const [title, setTitle] = useState(block.title ?? "");
  const [body, setBody] = useState(block.body ?? "");
  const [url, setUrl] = useState(block.url ?? "");
  const [caption, setCaption] = useState(block.caption ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = block.id;

  useEffect(() => {
    setTitle(block.title ?? "");
    setBody(block.body ?? "");
    setUrl(block.url ?? "");
    setCaption(block.caption ?? "");
  }, [id, block.title, block.body, block.url, block.caption]);

  async function upload(file: File) {
    if (isDemo()) {
      toast.info("Uploads are available after creating an account.");
      return;
    }
    setUploading(true);
    try {
      const path = `${block.user_id}/${block.topic_id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("study-files").upload(path, file);
      if (error) throw error;
      onSave({ storage_path: path, caption: caption || file.name });
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden>{def.emoji}</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== (block.title ?? "") && onSave({ title })}
          placeholder={`${def.label} title`}
          className="h-8 max-w-sm border-none bg-transparent px-0 text-sm font-semibold focus-visible:ring-0"
        />
        <span className="ml-auto text-[11px] uppercase tracking-wide text-muted-foreground">
          {def.label}
        </span>
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
        <Button variant="ghost" size="icon" aria-label="Duplicate block" onClick={onDuplicate}>
          <Copy className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete block"
          className="text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {def.body && (
        <Textarea
          value={body}
          rows={def.rows ?? 5}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => body !== (block.body ?? "") && onSave({ body })}
          placeholder={def.hint}
          className={cn(def.mono && "font-mono text-xs")}
        />
      )}

      {def.media && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => url !== (block.url ?? "") && onSave({ url: url || null })}
            placeholder={def.media === "video" ? "https://youtube.com/watch?v=…" : "https://…"}
          />
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={() => caption !== (block.caption ?? "") && onSave({ caption: caption || null })}
            placeholder="Caption / label"
          />
          {(def.media === "image" || def.media === "file") && (
            <div className="sm:col-span-2">
              <input
                ref={fileInput}
                type="file"
                hidden
                accept={def.media === "image" ? "image/*" : undefined}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                {block.storage_path ? "Replace upload" : "Upload"}
              </Button>
              {block.storage_path && (
                <span className="ml-2 text-xs text-muted-foreground">File attached</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
