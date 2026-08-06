import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCreate, useList, useRemove, useUpdate, type Assignment } from "@/lib/data";
import { EmptyState, PageHeader, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — StudyOS" },
      { name: "description", content: "Track assignment deadlines, status and progress." },
      { property: "og:title", content: "Assignments — StudyOS" },
      { property: "og:description", content: "Track assignment deadlines, status and progress." },
    ],
  }),
  component: AssignmentsPage,
});

const STATUSES = ["todo", "in_progress", "submitted", "graded"] as const;
const COLUMNS: { id: string; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "submitted", label: "Submitted" },
  { id: "graded", label: "Graded" },
];

function AssignmentsPage() {
  const { user } = useAuth();
  const assignments = useList("assignments", { build: (q) => q.order("due_at") });
  const subjects = useList("subjects", { build: (q) => q.order("position") });
  const create = useCreate("assignments", "Assignment added");
  const update = useUpdate("assignments", { silent: true });
  const remove = useRemove("assignments", "Assignment deleted");

  const [dialog, setDialog] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    notes: "",
    due_at: "",
    priority: "medium",
    subject_id: "none",
  });

  const all = assignments.data ?? [];
  const overdue = all.filter(
    (a) => a.due_at && new Date(a.due_at) < new Date() && a.status !== "graded",
  );

  async function add() {
    if (!user || !draft.title.trim()) return;
    await create.mutateAsync({
      user_id: user.id,
      title: draft.title.trim(),
      notes: draft.notes || null,
      due_at: draft.due_at ? new Date(draft.due_at).toISOString() : null,
      priority: draft.priority,
      subject_id: draft.subject_id === "none" ? null : draft.subject_id,
    });
    setDraft({ title: "", notes: "", due_at: "", priority: "medium", subject_id: "none" });
    setDialog(false);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Assignments"
        subtitle="Everything you owe, in one board"
        actions={
          <Button onClick={() => setDialog(true)}>
            <Plus className="size-4" /> New assignment
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={all.filter((a) => a.status !== "graded").length} icon={ClipboardList} />
        <StatCard label="Overdue" value={overdue.length} icon={ClipboardList} accent="destructive" />
        <StatCard
          label="Completed"
          value={all.filter((a) => a.status === "graded").length}
          icon={ClipboardList}
          accent="success"
        />
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments"
          description="Add coursework and track it from To do to Graded."
          action={<Button onClick={() => setDialog(true)}>Add assignment</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="panel p-3">
              <h2 className="mb-3 px-1 text-sm font-semibold">
                {col.label}{" "}
                <span className="text-muted-foreground">
                  {all.filter((a) => a.status === col.id).length}
                </span>
              </h2>
              <div className="space-y-3">
                {all
                  .filter((a) => a.status === col.id)
                  .map((a) => (
                    <Card
                      key={a.id}
                      item={a}
                      onChange={(values) => update.mutate({ id: a.id, values })}
                      onDelete={() => remove.mutate(a.id)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New assignment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input
                  type="datetime-local"
                  value={draft.due_at}
                  onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={draft.priority}
                  onValueChange={(v) => setDraft({ ...draft, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={draft.subject_id}
                onValueChange={(v) => setDraft({ ...draft, subject_id: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject</SelectItem>
                  {(subjects.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button onClick={add}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Card({
  item,
  onChange,
  onDelete,
}: {
  item: Assignment;
  onChange: (values: Partial<Assignment>) => void;
  onDelete: () => void;
}) {
  const late = item.due_at && new Date(item.due_at) < new Date() && item.status !== "graded";
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{item.title}</p>
        <Button variant="ghost" size="icon" aria-label="Delete" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
      {item.notes && <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {item.priority}
        </Badge>
        {item.due_at && (
          <Badge variant="outline" className={cn(late && "border-destructive text-destructive")}>
            {new Date(item.due_at).toLocaleDateString()}
          </Badge>
        )}
      </div>
      <Progress value={item.progress} className="mt-3 h-1.5" />
      <Slider
        className="mt-3"
        value={[item.progress]}
        max={100}
        step={5}
        onValueChange={([v]) => onChange({ progress: v ?? 0 })}
      />
      <Select value={item.status} onValueChange={(v) => onChange({ status: v })}>
        <SelectTrigger className="mt-3 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
