import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCreate, useList } from "@/lib/data";
import { PageHeader, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/timer")({
  head: () => ({
    meta: [
      { title: "Focus Timer — StudyOS" },
      { name: "description", content: "Pomodoro and stopwatch sessions logged to your stats." },
      { property: "og:title", content: "Focus Timer — StudyOS" },
      { property: "og:description", content: "Pomodoro and stopwatch sessions logged to your stats." },
    ],
  }),
  component: TimerPage,
});

const MODES = [
  { id: "focus", label: "Focus", minutes: 25 },
  { id: "short", label: "Short break", minutes: 5 },
  { id: "long", label: "Long break", minutes: 15 },
] as const;

function TimerPage() {
  const { user } = useAuth();
  const subjects = useList("subjects", { build: (q) => q.order("position") });
  const sessions = useList("study_sessions", {
    build: (q) => q.order("started_at", { ascending: false }).limit(20),
  });
  const logSession = useCreate("study_sessions");

  const [modeId, setModeId] = useState<(typeof MODES)[number]["id"]>("focus");
  const mode = MODES.find((m) => m.id === modeId) ?? MODES[0];
  const [secondsLeft, setSecondsLeft] = useState(mode.minutes * 60);
  const [running, setRunning] = useState(false);
  const [subjectId, setSubjectId] = useState<string>("none");
  const [completed, setCompleted] = useState(0);
  const startedAt = useRef<string>(new Date().toISOString());

  useEffect(() => {
    setSecondsLeft(mode.minutes * 60);
    setRunning(false);
  }, [mode.minutes]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    setRunning(false);
    setSecondsLeft(mode.minutes * 60);
    setCompleted((c) => c + 1);
    if (user && modeId === "focus") {
      logSession.mutate({
        user_id: user.id,
        minutes: mode.minutes,
        mode: modeId,
        started_at: startedAt.current,
        subject_id: subjectId === "none" ? null : subjectId,
      });
    }
    toast.success(`${mode.label} complete!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const total = mode.minutes * 60;
  const progress = 1 - secondsLeft / total;
  const mm = String(Math.floor(Math.max(secondsLeft, 0) / 60)).padStart(2, "0");
  const ss = String(Math.max(secondsLeft, 0) % 60).padStart(2, "0");

  const todayMinutes = (sessions.data ?? [])
    .filter((s) => new Date(s.started_at).toDateString() === new Date().toDateString())
    .reduce((a, s) => a + s.minutes, 0);

  return (
    <div className="animate-rise">
      <PageHeader title="Focus Timer" subtitle="Deep work sessions, logged automatically" />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="panel flex flex-col items-center gap-6 p-8">
          <div className="flex gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setModeId(m.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition-colors",
                  m.id === modeId
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="relative flex size-64 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute size-full -rotate-90">
              <circle cx="50" cy="50" r="45" className="fill-none stroke-border" strokeWidth="4" />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
              />
            </svg>
            <span className="text-6xl font-semibold tabular-nums">
              {mm}:{ss}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="lg"
              onClick={() => {
                if (!running) startedAt.current = new Date().toISOString();
                setRunning((r) => !r);
              }}
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setRunning(false);
                setSecondsLeft(mode.minutes * 60);
              }}
            >
              <RotateCcw className="size-4" /> Reset
            </Button>
          </div>

          <div className="w-full max-w-xs">
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Link a subject" />
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

        <div className="space-y-4">
          <StatCard label="Today" value={`${todayMinutes}m`} icon={TimerIcon} accent="primary" />
          <StatCard
            label="Sessions this run"
            value={completed}
            icon={Play}
            accent="success"
            hint="Completed cycles since page load"
          />
          <div className="panel p-4">
            <h3 className="mb-3 text-sm font-semibold">Recent sessions</h3>
            <ul className="space-y-2 text-sm">
              {(sessions.data ?? []).slice(0, 8).map((s) => (
                <li key={s.id} className="flex justify-between text-muted-foreground">
                  <span>{new Date(s.started_at).toLocaleString()}</span>
                  <span className="font-medium text-foreground">{s.minutes}m</span>
                </li>
              ))}
              {(sessions.data ?? []).length === 0 && (
                <li className="text-muted-foreground">No sessions logged yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
