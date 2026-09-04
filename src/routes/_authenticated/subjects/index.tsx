import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCreate, useList, useRemove, useUpdate, type Subject } from "@/lib/data";
import { EmptyState, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/subjects/")({
  head: () => ({
    meta: [
      { title: "Subjects — StudyOS" },
      { name: "description", content: "Manage every subject, its units, credits and progress." },
      { property: "og:title", content: "Subjects — StudyOS" },
      { property: "og:description", content: "All your subjects with progress and priorities." },
    ],
  }),
  component: SubjectsPage,
});

const COLORS = [
  "#22b8cf",
  "#12b886",
  "#fab005",
  "#fa5252",
  "#4c6ef5",
  "#e64980",
  "#7950f2",
  "#868e96",
];

type Draft = {
  name: string;
  code: string;
  description: string;
  color: string;
  semester: string;
  credits: string;
  estimated_hours: string;
};

const EMPTY: Draft = {
  name: "",
  code: "",
  description: "",
  color: COLORS[0] as string,
  semester: "",
  credits: "",
  estimated_hours: "",
};

function SubjectsPage() {
  const { user, isAdmin, demo } = useAuth();
  const canManage = isAdmin || demo;

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("position");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const subjects = useList("subjects", {
    key: ["all"],
    build: (q) => q.order("position", { ascending: true }),
  });
  const create = useCreate("subjects", "Subject created");
  const update = useUpdate("subjects", { silent: true });
  const remove = useRemove("subjects", "Subject deleted");

  const list = (subjects.data ?? [])
    .filter((s) => (showArchived ? true : !s.archived))
    .filter((s) =>
      query
        ? `${s.name} ${s.code ?? ""}`.toLowerCase().includes(query.toLowerCase())
        : true,
    )
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "semester") return (a.semester ?? 0) - (b.semester ?? 0);
      if (sort === "favorite") return Number(b.favorite) - Number(a.favorite);
      return a.position - b.position;
    });

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY);
    setOpen(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setDraft({
      name: s.name,
      code: s.code ?? "",
      description: s.description ?? "",
      color: s.color,
      semester: s.semester?.toString() ?? "",
      credits: s.credits?.toString() ?? "",
      estimated_hours: s.estimated_hours?.toString() ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!draft.name.trim() || !user) return;
    const values = {
      name: draft.name.trim(),
      code: draft.code || null,
      description: draft.description || null,
      color: draft.color,
      semester: draft.semester ? Number(draft.semester) : null,
      credits: draft.credits ? Number(draft.credits) : null,
      estimated_hours: draft.estimated_hours ? Number(draft.estimated_hours) : 0,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, values });
    } else {
      await create.mutateAsync({
        ...values,
        user_id: user.id,
        position: (subjects.data?.length ?? 0) + 1,
      });
    }
    setOpen(false);
  }

  function move(s: Subject, dir: -1 | 1) {
    const ordered = [...(subjects.data ?? [])].sort((a, b) => a.position - b.position);
    const i = ordered.findIndex((x) => x.id === s.id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;
    const other = ordered[j] as Subject;
    update.mutate({ id: s.id, values: { position: other.position } });
    update.mutate({ id: other.id, values: { position: s.position } });
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Subjects"
        subtitle="Every course you're studying, with units, topics and progress."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="size-4" /> Add subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit subject" : "New subject"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <Field label="Name">
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Operating Systems"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Code">
                    <Input
                      value={draft.code}
                      onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                      placeholder="CS304"
                    />
                  </Field>
                  <Field label="Semester">
                    <Input
                      type="number"
                      value={draft.semester}
                      onChange={(e) => setDraft({ ...draft, semester: e.target.value })}
                    />
                  </Field>
                  <Field label="Credits">
                    <Input
                      type="number"
                      value={draft.credits}
                      onChange={(e) => setDraft({ ...draft, credits: e.target.value })}
                    />
                  </Field>
                  <Field label="Estimated hours">
                    <Input
                      type="number"
                      value={draft.estimated_hours}
                      onChange={(e) =>
                        setDraft({ ...draft, estimated_hours: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={3}
                  />
                </Field>
                <Field label="Colour">
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDraft({ ...draft, color: c })}
                        className="size-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          background: c,
                          borderColor: draft.color === c ? "var(--foreground)" : "transparent",
                        }}
                        aria-label={`Colour ${c}`}
                      />
                    ))}
                  </div>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={save}>{editing ? "Save changes" : "Create subject"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects…"
          className="max-w-xs"
        />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="position">Custom order</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="semester">Semester</SelectItem>
            <SelectItem value="favorite">Favorites first</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          Show archived
        </label>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No subjects yet"
          description="Create your first subject and start building units and topics under it."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Add subject
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => (
            <SubjectCard
              key={s.id}
              subject={s}
              onEdit={() => openEdit(s)}
              onDelete={() => remove.mutate(s.id)}
              onToggle={(values) => update.mutate({ id: s.id, values })}
              onMove={(dir) => move(s, dir)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectCard({
  subject,
  onEdit,
  onDelete,
  onToggle,
  onMove,
}: {
  subject: Subject;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (values: Partial<Subject>) => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const topics = useList("topics", {
    key: ["by-subject", subject.id],
    build: (q) => q.eq("subject_id", subject.id),
  });
  const units = useList("units", {
    key: ["by-subject", subject.id],
    build: (q) => q.eq("subject_id", subject.id),
  });
  const all = topics.data ?? [];
  const done = all.filter((t) => t.completed).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  return (
    <div className="panel lift lift-hover relative overflow-hidden p-5">
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: subject.color }}
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <Link
          to="/subjects/$subjectId"
          params={{ subjectId: subject.id }}
          className="min-w-0 flex-1"
        >
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold">{subject.name}</h2>
            {subject.favorite && <Star className="size-3.5 fill-warning text-warning" />}
            {subject.archived && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                archived
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[subject.code, subject.semester ? `Sem ${subject.semester}` : null,
              subject.credits ? `${subject.credits} credits` : null]
              .filter(Boolean)
              .join(" · ") || "No metadata"}
          </p>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Subject actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggle({ favorite: !subject.favorite })}>
              <Star className="size-4" /> {subject.favorite ? "Unfavorite" : "Favorite"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggle({ archived: !subject.archived })}>
              <Archive className="size-4" /> {subject.archived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(-1)}>
              <ArrowUp className="size-4" /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(1)}>
              <ArrowDown className="size-4" /> Move down
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Progress value={pct} className="mt-4 h-1.5" />
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {units.data?.length ?? 0} units · {all.length} topics
        </span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
