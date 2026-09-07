import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCreate, useList, useRemove, useUpdate, type Row } from "@/lib/data";
import { EmptyState, PageHeader, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Study planner — StudyOS" },
      {
        name: "description",
        content: "Plan daily and weekly study slots, attach topics and keep due dates on track.",
      },
      { property: "og:title", content: "Study planner — StudyOS" },
      {
        property: "og:description",
        content: "Plan daily and weekly study slots with topics and due dates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

type Slot = Row<"planner_slots">;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // Monday first
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function PlannerPage() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [view, setView] = useState<"week" | "day">("week");
  const [dialogDate, setDialogDate] = useState<string | null>(null);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const from = dayKey(days[0]!);
  const to = dayKey(days[6]!);

  const slots = useList("planner_slots", {
    key: [from],
    build: (q) =>
      q.gte("slot_date", from).lte("slot_date", to).order("slot_date").order("position"),
  });
  const subjects = useList("subjects", { build: (q) => q.order("position") });
  const topics = useList("topics", { build: (q) => q.order("position").limit(500) });

  const create = useCreate("planner_slots", "Slot added");
  const update = useUpdate("planner_slots", { silent: true });
  const remove = useRemove("planner_slots", "Slot removed");

  const all = (slots.data ?? []) as Slot[];
  const today = dayKey(new Date());
  const visibleDays = view === "week" ? days : days.filter((d) => dayKey(d) === today);

  const [draft, setDraft] = useState({
    title: "",
    notes: "",
    start_time: "",
    duration_minutes: 60,
    due_at: "",
    subject_id: "none",
    topic_id: "none",
  });

  const done = all.filter((s) => s.status === "done").length;
  const plannedMinutes = all.reduce((t, s) => t + (s.duration_minutes ?? 0), 0);

  async function add() {
    if (!user || !dialogDate || !draft.title.trim()) return;
    await create.mutateAsync({
      user_id: user.id,
      title: draft.title.trim(),
      notes: draft.notes || null,
      slot_date: dialogDate,
      start_time: draft.start_time || null,
      duration_minutes: Number(draft.duration_minutes) || 60,
      due_at: draft.due_at ? new Date(draft.due_at).toISOString() : null,
      subject_id: draft.subject_id === "none" ? null : draft.subject_id,
      topic_id: draft.topic_id === "none" ? null : draft.topic_id,
      position: all.filter((s) => s.slot_date === dialogDate).length,
    } as never);
    setDraft({
      title: "",
      notes: "",
      start_time: "",
      duration_minutes: 60,
      due_at: "",
      subject_id: "none",
      topic_id: "none",
    });
    setDialogDate(null);
  }

  function shiftWeek(n: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + n * 7);
    setWeekStart(d);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Study planner"
        subtitle="Daily and weekly slots, topics and due dates"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => shiftWeek(-1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
            >
              This week
            </Button>
            <Button variant="outline" size="sm" onClick={() => shiftWeek(1)}>
              Next
            </Button>
            <Button
              size="sm"
              variant={view === "week" ? "default" : "outline"}
              onClick={() => setView(view === "week" ? "day" : "week")}
            >
              {view === "week" ? "Week" : "Today"}
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Slots this week" value={all.length} icon={CalendarDays} />
        <StatCard
          label="Planned time"
          value={`${Math.round((plannedMinutes / 60) * 10) / 10}h`}
          icon={Clock}
        />
        <StatCard label="Completed" value={done} icon={CheckCircle2} accent="success" />
      </div>

      {all.length === 0 && view === "week" ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing planned yet"
          description="Add a study slot to any day and attach the topic you want to cover."
          action={<Button onClick={() => setDialogDate(today)}>Plan a slot</Button>}
        />
      ) : null}

      <div
        className={cn(
          "grid gap-4",
          view === "week" ? "md:grid-cols-2 xl:grid-cols-4" : "max-w-2xl",
        )}
      >
        {visibleDays.map((d) => {
          const key = dayKey(d);
          const rows = all.filter((s) => s.slot_date === key);
          return (
            <div key={key} className="panel p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <h2 className="text-sm font-semibold">
                    {d.toLocaleDateString(undefined, { weekday: "long" })}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    {key === today ? " · Today" : ""}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Add slot on ${key}`}
                  onClick={() => setDialogDate(key)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {rows.length === 0 && (
                  <p className="px-1 pb-2 text-xs text-muted-foreground">No slots.</p>
                )}
                {rows.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-lg border border-border bg-card p-3",
                      s.status === "done" && "opacity-60",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        aria-label="Toggle done"
                        onClick={() =>
                          update.mutate({
                            id: s.id,
                            values: {
                              status: s.status === "done" ? "planned" : "done",
                            } as never,
                          })
                        }
                        className="mt-0.5"
                      >
                        <CheckCircle2
                          className={cn(
                            "size-4",
                            s.status === "done" ? "text-success" : "text-muted-foreground",
                          )}
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            s.status === "done" && "line-through",
                          )}
                        >
                          {s.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {s.start_time && (
                            <Badge variant="secondary" className="text-[10px]">
                              {String(s.start_time).slice(0, 5)}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {s.duration_minutes}m
                          </Badge>
                          {s.due_at && (
                            <Badge variant="outline" className="text-[10px]">
                              due {new Date(s.due_at).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        {s.notes && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {s.notes}
                          </p>
                        )}
                      </div>
                      <button
                        aria-label="Delete slot"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => remove.mutate(s.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogDate !== null} onOpenChange={(o) => !o && setDialogDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New study slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slot-title">Title</Label>
              <Input
                id="slot-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Revise consumer behaviour"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slot-time">Start time</Label>
                <Input
                  id="slot-time"
                  type="time"
                  value={draft.start_time}
                  onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-duration">Duration (min)</Label>
                <Input
                  id="slot-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={draft.duration_minutes}
                  onChange={(e) =>
                    setDraft({ ...draft, duration_minutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-due">Due date</Label>
              <Input
                id="slot-due"
                type="datetime-local"
                value={draft.due_at}
                onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    {(subjects.data ?? []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select
                  value={draft.topic_id}
                  onValueChange={(v) => setDraft({ ...draft, topic_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No topic</SelectItem>
                    {(topics.data ?? [])
                      .filter(
                        (t: any) =>
                          draft.subject_id === "none" || t.subject_id === draft.subject_id,
                      )
                      .slice(0, 200)
                      .map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-notes">Notes</Label>
              <Textarea
                id="slot-notes"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDate(null)}>
              Cancel
            </Button>
            <Button onClick={add} disabled={!draft.title.trim()}>
              Add slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
