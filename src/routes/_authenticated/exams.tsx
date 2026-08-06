import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCreate, useList, useRemove, useUpdate } from "@/lib/data";
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

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({
    meta: [
      { title: "Exams — StudyOS" },
      { name: "description", content: "Exam countdowns, syllabus and preparation tracking." },
      { property: "og:title", content: "Exams — StudyOS" },
      { property: "og:description", content: "Exam countdowns, syllabus and preparation tracking." },
    ],
  }),
  component: ExamsPage,
});

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function ExamsPage() {
  const { user } = useAuth();
  const exams = useList("exams", { build: (q) => q.order("exam_date") });
  const subjects = useList("subjects", { build: (q) => q.order("position") });
  const create = useCreate("exams", "Exam added");
  const update = useUpdate("exams", { silent: true });
  const remove = useRemove("exams", "Exam deleted");

  const [dialog, setDialog] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    exam_date: "",
    exam_time: "",
    venue: "",
    hall_ticket: "",
    syllabus: "",
    subject_id: "none",
  });

  const all = exams.data ?? [];
  const upcoming = all.filter((e) => e.exam_date && daysUntil(e.exam_date) >= 0);

  async function add() {
    if (!user || !draft.name.trim()) return;
    await create.mutateAsync({
      user_id: user.id,
      name: draft.name.trim(),
      exam_date: draft.exam_date || null,
      exam_time: draft.exam_time || null,
      venue: draft.venue || null,
      hall_ticket: draft.hall_ticket || null,
      syllabus: draft.syllabus || null,
      subject_id: draft.subject_id === "none" ? null : draft.subject_id,
    });
    setDraft({
      name: "",
      exam_date: "",
      exam_time: "",
      venue: "",
      hall_ticket: "",
      syllabus: "",
      subject_id: "none",
    });
    setDialog(false);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Exams"
        subtitle="Countdowns, syllabus and readiness"
        actions={
          <Button onClick={() => setDialog(true)}>
            <Plus className="size-4" /> New exam
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming" value={upcoming.length} icon={CalendarClock} />
        <StatCard
          label="Next exam in"
          value={
            upcoming[0]?.exam_date ? `${Math.max(daysUntil(upcoming[0].exam_date), 0)}d` : "—"
          }
          icon={CalendarClock}
          accent="warning"
        />
        <StatCard
          label="Avg preparation"
          value={`${Math.round(
            (upcoming.reduce((a, e) => a + e.preparation, 0) / (upcoming.length || 1)) || 0,
          )}%`}
          icon={CalendarClock}
          accent="success"
        />
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No exams scheduled"
          description="Add your exam dates to unlock countdowns and preparation tracking."
          action={<Button onClick={() => setDialog(true)}>Add exam</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {all.map((e) => {
            const d = e.exam_date ? daysUntil(e.exam_date) : null;
            return (
              <div key={e.id} className="panel lift lift-hover p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{e.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {e.exam_date ? new Date(e.exam_date).toDateString() : "Date TBD"}
                      {e.exam_time ? ` · ${e.exam_time}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Delete exam" onClick={() => remove.mutate(e.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>

                {d !== null && (
                  <Badge
                    variant={d <= 7 ? "destructive" : "secondary"}
                    className="mt-3"
                  >
                    {d < 0 ? "Completed" : d === 0 ? "Today" : `${d} days left`}
                  </Badge>
                )}

                {e.venue && <p className="mt-3 text-sm text-muted-foreground">Venue: {e.venue}</p>}
                {e.hall_ticket && (
                  <p className="text-sm text-muted-foreground">Hall ticket: {e.hall_ticket}</p>
                )}
                {e.syllabus && <p className="mt-2 text-sm">{e.syllabus}</p>}

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Preparation</span>
                    <span>{e.preparation}%</span>
                  </div>
                  <Progress value={e.preparation} className="h-1.5" />
                  <Slider
                    className="mt-3"
                    value={[e.preparation]}
                    max={100}
                    step={5}
                    onValueChange={([v]) =>
                      update.mutate({ id: e.id, values: { preparation: v ?? 0 } })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New exam</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={draft.exam_date}
                  onChange={(e) => setDraft({ ...draft, exam_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={draft.exam_time}
                  onChange={(e) => setDraft({ ...draft, exam_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input value={draft.venue} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hall ticket</Label>
                <Input
                  value={draft.hall_ticket}
                  onChange={(e) => setDraft({ ...draft, hall_ticket: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Syllabus</Label>
              <Textarea
                rows={3}
                value={draft.syllabus}
                onChange={(e) => setDraft({ ...draft, syllabus: e.target.value })}
              />
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
