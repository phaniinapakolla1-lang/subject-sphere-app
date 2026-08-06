import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  useCreate,
  useList,
  useOne,
  useRemove,
  useUpdate,
  type Topic,
  type Unit,
} from "@/lib/data";
import { PRIORITIES, DIFFICULTIES } from "@/lib/topic-schema";
import { EmptyState, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/subjects/$subjectId")({
  head: () => ({
    meta: [
      { title: "Subject — StudyOS" },
      { name: "description", content: "Units and topics inside this subject." },
      { property: "og:title", content: "Subject — StudyOS" },
      { property: "og:description", content: "Units and topics inside this subject." },
    ],
  }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { subjectId } = Route.useParams();
  const { user } = useAuth();
  const subject = useOne("subjects", subjectId);
  const units = useList("units", {
    key: ["of", subjectId],
    build: (q) => q.eq("subject_id", subjectId).order("position"),
  });
  const topics = useList("topics", {
    key: ["of", subjectId],
    build: (q) => q.eq("subject_id", subjectId).order("position"),
  });

  const createUnit = useCreate("units", "Unit added");
  const updateUnit = useUpdate("units", { silent: true });
  const removeUnit = useRemove("units", "Unit deleted");
  const createTopic = useCreate("topics", "Topic added");
  const updateTopic = useUpdate("topics", { silent: true });
  const removeTopic = useRemove("topics", "Topic deleted");

  const [unitDialog, setUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitDraft, setUnitDraft] = useState({
    name: "",
    description: "",
    estimated_hours: "",
    priority: "medium",
  });

  const allTopics = topics.data ?? [];
  const done = allTopics.filter((t) => t.completed).length;
  const pct = allTopics.length ? Math.round((done / allTopics.length) * 100) : 0;

  function openUnit(u?: Unit) {
    setEditingUnit(u ?? null);
    setUnitDraft({
      name: u?.name ?? "",
      description: u?.description ?? "",
      estimated_hours: u?.estimated_hours?.toString() ?? "",
      priority: u?.priority ?? "medium",
    });
    setUnitDialog(true);
  }

  async function saveUnit() {
    if (!unitDraft.name.trim() || !user) return;
    const values = {
      name: unitDraft.name.trim(),
      description: unitDraft.description || null,
      estimated_hours: unitDraft.estimated_hours ? Number(unitDraft.estimated_hours) : 0,
      priority: unitDraft.priority,
    };
    if (editingUnit) await updateUnit.mutateAsync({ id: editingUnit.id, values });
    else
      await createTopicless(values);
    setUnitDialog(false);
  }

  async function createTopicless(values: Record<string, unknown>) {
    if (!user) return;
    await createUnit.mutateAsync({
      ...(values as { name: string }),
      subject_id: subjectId,
      user_id: user.id,
      position: (units.data?.length ?? 0) + 1,
    });
  }

  function moveUnit(u: Unit, dir: -1 | 1) {
    const ordered = [...(units.data ?? [])].sort((a, b) => a.position - b.position);
    const i = ordered.findIndex((x) => x.id === u.id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;
    const other = ordered[j] as Unit;
    updateUnit.mutate({ id: u.id, values: { position: other.position } });
    updateUnit.mutate({ id: other.id, values: { position: u.position } });
  }

  async function addTopic(unitId: string, title: string) {
    if (!user || !title.trim()) return;
    await createTopic.mutateAsync({
      title: title.trim(),
      unit_id: unitId,
      subject_id: subjectId,
      user_id: user.id,
      position: allTopics.filter((t) => t.unit_id === unitId).length + 1,
    });
  }

  async function duplicateTopic(t: Topic) {
    if (!user) return;
    await createTopic.mutateAsync({
      title: `${t.title} (copy)`,
      unit_id: t.unit_id,
      subject_id: t.subject_id,
      user_id: user.id,
      content: t.content,
      priority: t.priority,
      difficulty: t.difficulty,
      estimated_minutes: t.estimated_minutes,
      position: t.position + 1,
    });
  }

  return (
    <div className="animate-rise">
      <Link
        to="/subjects"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All subjects
      </Link>

      <PageHeader
        title={subject.data?.name ?? "Subject"}
        subtitle={subject.data?.description ?? "Units and topics"}
        actions={
          <Button onClick={() => openUnit()}>
            <Plus className="size-4" /> Add unit
          </Button>
        }
      />

      <div className="panel mb-6 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {units.data?.length ?? 0} units · {allTopics.length} topics · {done} completed
          </span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <Progress value={pct} className="mt-3 h-2" />
      </div>

      {(units.data ?? []).length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No units yet"
          description="Split this subject into units, then add topics inside each unit."
          action={<Button onClick={() => openUnit()}>Add your first unit</Button>}
        />
      ) : (
        <div className="space-y-4">
          {(units.data ?? []).map((u) => (
            <UnitBlock
              key={u.id}
              unit={u}
              topics={allTopics.filter((t) => t.unit_id === u.id)}
              onEdit={() => openUnit(u)}
              onDelete={() => removeUnit.mutate(u.id)}
              onMove={(d) => moveUnit(u, d)}
              onAddTopic={(title) => addTopic(u.id, title)}
              onTopicChange={(id, values) => updateTopic.mutate({ id, values })}
              onTopicDelete={(id) => removeTopic.mutate(id)}
              onTopicDuplicate={duplicateTopic}
            />
          ))}
        </div>
      )}

      <Dialog open={unitDialog} onOpenChange={setUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnit ? "Edit unit" : "New unit"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={unitDraft.name}
                onChange={(e) => setUnitDraft({ ...unitDraft, name: e.target.value })}
                placeholder="Unit 1 — Process Management"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={unitDraft.description}
                onChange={(e) =>
                  setUnitDraft({ ...unitDraft, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Estimated hours</Label>
                <Input
                  type="number"
                  value={unitDraft.estimated_hours}
                  onChange={(e) =>
                    setUnitDraft({ ...unitDraft, estimated_hours: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={unitDraft.priority}
                  onValueChange={(v) => setUnitDraft({ ...unitDraft, priority: v })}
                >
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUnitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveUnit}>{editingUnit ? "Save" : "Create unit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UnitBlock({
  unit,
  topics,
  onEdit,
  onDelete,
  onMove,
  onAddTopic,
  onTopicChange,
  onTopicDelete,
  onTopicDuplicate,
}: {
  unit: Unit;
  topics: Topic[];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onAddTopic: (title: string) => void;
  onTopicChange: (id: string, values: Partial<Topic>) => void;
  onTopicDelete: (id: string) => void;
  onTopicDuplicate: (t: Topic) => void;
}) {
  const [newTopic, setNewTopic] = useState("");
  const done = topics.filter((t) => t.completed).length;
  const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;

  return (
    <section className="panel p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold">{unit.name}</h2>
            <Badge variant="secondary" className="capitalize">
              {unit.priority}
            </Badge>
          </div>
          {unit.description && (
            <p className="mt-1 text-sm text-muted-foreground">{unit.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{pct}%</div>
          <div className="text-xs text-muted-foreground">
            {done}/{topics.length}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Unit actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" /> Edit unit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(-1)}>
              <ArrowUp className="size-4" /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(1)}>
              <ArrowDown className="size-4" /> Move down
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="size-4" /> Delete unit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Progress value={pct} className="mt-3 h-1.5" />

      <ul className="mt-4 divide-y divide-border">
        {topics.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2">
            <Checkbox
              checked={t.completed}
              onCheckedChange={(v) => onTopicChange(t.id, { completed: !!v })}
              aria-label="Mark complete"
            />
            <Link
              to="/topics/$topicId"
              params={{ topicId: t.id }}
              className={cn(
                "min-w-0 flex-1 truncate text-sm hover:text-primary",
                t.completed && "text-muted-foreground line-through",
              )}
            >
              {t.title}
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {t.estimated_minutes}m
            </span>
            <Badge variant="outline" className="hidden capitalize sm:inline-flex">
              {t.difficulty}
            </Badge>
            {t.weak && <TriangleAlert className="size-4 text-destructive" />}
            {t.bookmarked && <Bookmark className="size-4 text-primary" />}
            {t.favorite && <Star className="size-4 fill-warning text-warning" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Topic actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTopicChange(t.id, { favorite: !t.favorite })}>
                  <Star className="size-4" /> {t.favorite ? "Unfavorite" : "Favorite"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onTopicChange(t.id, { bookmarked: !t.bookmarked })}
                >
                  <Bookmark className="size-4" /> {t.bookmarked ? "Remove bookmark" : "Bookmark"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTopicChange(t.id, { weak: !t.weak })}>
                  <TriangleAlert className="size-4" /> {t.weak ? "Not weak" : "Mark weak"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTopicDuplicate(t)}>
                  <Copy className="size-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTopicDelete(t.id)} className="text-destructive">
                  <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onAddTopic(newTopic);
          setNewTopic("");
        }}
      >
        <Input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="Add a topic…"
          className="h-9"
        />
        <Button type="submit" size="sm" variant="secondary">
          <Check className="size-4" /> Add
        </Button>
      </form>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Difficulty options: {DIFFICULTIES.join(", ")}
      </p>
    </section>
  );
}
