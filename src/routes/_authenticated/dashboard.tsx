import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bookmark,
  CalendarClock,
  Flame,
  Layers,
  NotebookPen,
  Plus,
  Target,
  TriangleAlert,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useAuth } from "@/lib/auth";
import { useList, type Topic } from "@/lib/data";
import { formatMinutes, useOverview } from "@/lib/stats";
import { ScrollHeader, ChakraRing } from "@/components/anime-kit";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StudyOS" },
      { name: "description", content: "Your study streak, progress, upcoming exams and today's plan." },
      { property: "og:title", content: "Dashboard — StudyOS" },
      { property: "og:description", content: "Streak, progress, exams and today's study plan." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useOverview();
  const goal = 120;

  const subjects = useList("subjects", {
    key: ["dash"],
    build: (q) => q.eq("archived", false).order("position"),
  });
  const recentTopics = useList("topics", {
    key: ["recent"],
    build: (q) => q.order("updated_at", { ascending: false }).limit(6),
  });
  const bookmarked = useList("topics", {
    key: ["bookmarked"],
    build: (q) => q.eq("bookmarked", true).limit(6),
  });
  const weak = useList("topics", {
    key: ["weak"],
    build: (q) => q.eq("weak", true).limit(6),
  });
  const exams = useList("exams", {
    key: ["upcoming"],
    build: (q) => q.order("exam_date", { ascending: true }).limit(4),
  });
  const assignments = useList("assignments", {
    key: ["due"],
    build: (q) => q.neq("status", "done").order("due_at", { ascending: true }).limit(5),
  });
  const notes = useList("notes", {
    key: ["quick"],
    build: (q) => q.order("updated_at", { ascending: false }).limit(4),
  });

  const name =
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const completion = stats?.topics
    ? Math.round((stats.completedTopics / stats.topics) * 100)
    : 0;
  const todayPct = stats ? Math.min(100, Math.round((stats.minutesToday / goal) * 100)) : 0;

  const pieData = [
    { name: "Completed", value: stats?.completedTopics ?? 0 },
    { name: "Remaining", value: Math.max(0, (stats?.topics ?? 0) - (stats?.completedTopics ?? 0)) },
  ];
  const pieColors = ["var(--chart-2)", "var(--muted)"];

  const streakDays = stats?.streak ?? 0;
  const streakPct = Math.min(100, Math.round((streakDays / 30) * 100));
  const weakCount = stats?.weakTopics ?? 0;
  const strongPct = stats?.topics
    ? Math.max(0, 100 - Math.round((weakCount / stats.topics) * 100))
    : 100;

  return (
    <div className="space-y-6 animate-rise">
      {/* Mission scroll welcome */}
      <ScrollHeader
        title={`${greeting()}, ${name}`}
        subtitle="Your training scroll for today — here's where your studying stands."
        actions={
          <Button asChild>
            <Link to="/subjects">
              <Plus className="size-4" /> New subject
            </Link>
          </Button>
        }
      />

      {/* Chakra rings */}
      <div className="panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Chakra levels</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            Live snapshot of your study energy
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <RingStat
            ring={
              <ChakraRing
                value={streakPct}
                color="var(--chart-3)"
                label={`${streakDays}d`}
                sublabel="streak"
              />
            }
            title="Study streak"
            hint="Consecutive days with a logged session"
          />
          <RingStat
            ring={
              <ChakraRing
                value={todayPct}
                color="var(--chart-1)"
                label={`${todayPct}%`}
                sublabel={formatMinutes(stats?.minutesToday ?? 0)}
              />
            }
            title="Today's goal"
            hint={`${formatMinutes(stats?.minutesToday ?? 0)} of 2h target`}
          />
          <RingStat
            ring={
              <ChakraRing
                value={completion}
                color="var(--chart-2)"
                label={`${completion}%`}
                sublabel="complete"
              />
            }
            title="Overall progress"
            hint={`${stats?.completedTopics ?? 0} of ${stats?.topics ?? 0} topics done`}
          />
          <RingStat
            ring={
              <ChakraRing
                value={strongPct}
                color="var(--chart-5)"
                label={`${weakCount}`}
                sublabel="weak"
              />
            }
            title="Weak topics"
            hint={
              weakCount === 0
                ? "No weak spots — strong chakra control"
                : "Flagged for extra revision"
            }
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Weekly study hours</h2>
            <span className="text-xs text-muted-foreground">
              {formatMinutes(stats?.minutesWeek ?? 0)} this week
            </span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weekly ?? []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => [formatMinutes(v), "Studied"]}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold">Topic completion</h2>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Monthly time" value={formatMinutes(stats?.minutesMonth ?? 0)} />
            <Row label="Avg session" value={formatMinutes(stats?.avgSessionMinutes ?? 0)} />
            <Row label="Revisions" value={String(stats?.revisions ?? 0)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Continue studying" icon={Layers} href="/subjects">
          {(recentTopics.data ?? []).length === 0 && <Muted>No topics yet.</Muted>}
          {(recentTopics.data ?? []).map((t: Topic) => (
            <Link
              key={t.id}
              to="/topics/$topicId"
              params={{ topicId: t.id }}
              className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
            >
              <span className="truncate">{t.title}</span>
              {t.completed ? (
                <Badge variant="secondary">Done</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">{t.estimated_minutes}m</span>
              )}
            </Link>
          ))}
        </Panel>

        <Panel title="Upcoming exams" icon={CalendarClock} href="/exams">
          {(exams.data ?? []).length === 0 && <Muted>No exams scheduled.</Muted>}
          {(exams.data ?? []).map((e) => {
            const days = e.exam_date
              ? Math.ceil(
                  (new Date(e.exam_date).getTime() - Date.now()) / 86400000,
                )
              : null;
            return (
              <div key={e.id} className="rounded-lg px-2 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{e.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {days === null ? "—" : days >= 0 ? `${days}d left` : "past"}
                  </span>
                </div>
                <Progress value={e.preparation} className="mt-2 h-1.5" />
              </div>
            );
          })}
        </Panel>

        <Panel title="Today's schedule" icon={Target} href="/assignments">
          {(assignments.data ?? []).length === 0 && <Muted>Nothing due. Enjoy.</Muted>}
          {(assignments.data ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between px-2 py-2 text-sm">
              <span className="truncate">{a.title}</span>
              <span className="text-xs text-muted-foreground">
                {a.due_at ? new Date(a.due_at).toLocaleDateString() : "no date"}
              </span>
            </div>
          ))}
        </Panel>

        <Panel title="Bookmarked topics" icon={Bookmark} href="/subjects">
          {(bookmarked.data ?? []).length === 0 && <Muted>Nothing bookmarked yet.</Muted>}
          {(bookmarked.data ?? []).map((t) => (
            <Link
              key={t.id}
              to="/topics/$topicId"
              params={{ topicId: t.id }}
              className="block truncate rounded-lg px-2 py-2 text-sm hover:bg-muted"
            >
              {t.title}
            </Link>
          ))}
        </Panel>

        <Panel title="Weak topics" icon={TriangleAlert} href="/revision">
          {(weak.data ?? []).length === 0 && <Muted>No weak topics flagged.</Muted>}
          {(weak.data ?? []).map((t) => (
            <Link
              key={t.id}
              to="/topics/$topicId"
              params={{ topicId: t.id }}
              className="block truncate rounded-lg px-2 py-2 text-sm hover:bg-muted"
            >
              {t.title}
            </Link>
          ))}
        </Panel>

        <Panel title="Quick notes" icon={NotebookPen} href="/notes">
          {(notes.data ?? []).length === 0 && <Muted>No notes yet.</Muted>}
          {(notes.data ?? []).map((n) => (
            <Link key={n.id} to="/notes" className="block rounded-lg px-2 py-2 hover:bg-muted">
              <div className="truncate text-sm">{n.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {n.body.slice(0, 60) || "Empty note"}
              </div>
            </Link>
          ))}
        </Panel>
      </div>

      <div className="panel p-5">
        <h2 className="text-sm font-semibold">Subject progress</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(subjects.data ?? []).map((s) => (
            <SubjectProgress key={s.id} id={s.id} name={s.name} color={s.color} />
          ))}
          {(subjects.data ?? []).length === 0 && (
            <Muted>Add your first subject to start tracking progress.</Muted>
          )}
        </div>
      </div>
    </div>
  );
}

function RingStat({
  ring,
  title,
  hint,
}: {
  ring: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border p-4">
      {ring}
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}

function SubjectProgress({ id, name, color }: { id: string; name: string; color: string }) {
  const topics = useList("topics", {
    key: ["progress", id],
    build: (q) => q.eq("subject_id", id),
  });
  const list = topics.data ?? [];
  const done = list.filter((t) => t.completed).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
  return (
    <Link
      to="/subjects/$subjectId"
      params={{ subjectId: id }}
      className="rounded-xl border border-border p-3 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{pct}%</span>
      </div>
      <Progress value={pct} className="mt-3 h-1.5" />
      <p className="mt-2 text-xs text-muted-foreground">
        {done}/{list.length} topics complete
      </p>
    </Link>
  );
}

function Panel({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: React.ElementType;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          to={href}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-3 text-sm text-muted-foreground">{children}</p>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
