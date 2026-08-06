import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { NotebookPen, Pin, Search, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCreate, useList, useRemove, useUpdate, type Note } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import { EmptyState, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({
    meta: [
      { title: "Notes — StudyOS" },
      { name: "description", content: "Capture quick notes and build your knowledge base." },
      { property: "og:title", content: "Notes — StudyOS" },
      { property: "og:description", content: "Capture quick notes and build your knowledge base." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { user } = useAuth();
  const notes = useList("notes", {
    build: (q) => q.order("pinned", { ascending: false }).order("updated_at", { ascending: false }),
  });
  const create = useCreate("notes");
  const update = useUpdate("notes", { silent: true });
  const remove = useRemove("notes", "Note deleted");

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const list = useMemo(() => {
    const all = notes.data ?? [];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [notes.data, query]);

  const active = list.find((n) => n.id === activeId) ?? list[0] ?? null;

  async function addNote() {
    if (!user) return;
    const note = await create.mutateAsync({
      user_id: user.id,
      title: "Untitled note",
      body: "",
    });
    setActiveId(note.id);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Notes"
        subtitle="Markdown-friendly quick capture for everything you learn"
        actions={<Button onClick={addNote}>New note</Button>}
      />

      {(notes.data ?? []).length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description="Jot down ideas, definitions and links. Everything is searchable with ⌘K."
          action={<Button onClick={addNote}>Write your first note</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="panel flex max-h-[70vh] flex-col p-3">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter notes…"
                className="pl-8"
              />
            </div>
            <ul className="flex-1 space-y-1 overflow-y-auto">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => setActiveId(n.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent",
                      active?.id === n.id && "bg-accent",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {n.pinned && <Pin className="size-3 text-primary" />}
                      <span className="truncate text-sm font-medium">{n.title}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {n.body.slice(0, 70) || "Empty note"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {active && (
            <NoteEditor
              key={active.id}
              note={active}
              preview={preview}
              onTogglePreview={() => setPreview((p) => !p)}
              onChange={(values) => update.mutate({ id: active.id, values })}
              onDelete={() => {
                remove.mutate(active.id);
                setActiveId(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function NoteEditor({
  note,
  preview,
  onTogglePreview,
  onChange,
  onDelete,
}: {
  note: Note;
  preview: boolean;
  onTogglePreview: () => void;
  onChange: (values: Partial<Note>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [tagInput, setTagInput] = useState("");

  return (
    <div className="panel flex flex-col p-5">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onChange({ title: title.trim() || "Untitled note" })}
          className="flex-1 border-0 bg-transparent text-xl font-semibold outline-none"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pin note"
          onClick={() => onChange({ pinned: !note.pinned })}
        >
          <Pin className={cn("size-4", note.pinned && "text-primary")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Bookmark note"
          onClick={() => onChange({ bookmarked: !note.bookmarked })}
        >
          <Star className={cn("size-4", note.bookmarked && "fill-warning text-warning")} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onTogglePreview}>
          {preview ? "Edit" : "Preview"}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete note" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {note.tags.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => onChange({ tags: note.tags.filter((x) => x !== t) })}
          >
            #{t} ✕
          </Badge>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tagInput.trim()) {
              onChange({ tags: [...note.tags, tagInput.trim()] });
              setTagInput("");
            }
          }}
          placeholder="add tag…"
          className="w-24 border-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      {preview ? (
        <div
          className="prose-studyos mt-4 min-h-[50vh] text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
        />
      ) : (
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => onChange({ body })}
          placeholder="Start writing… markdown supported"
          className="mt-4 min-h-[50vh] resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      )}
    </div>
  );
}
