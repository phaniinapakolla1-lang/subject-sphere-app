import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BookOpen,
  Brain,
  CalendarClock,
  FileText,
  LayoutDashboard,
  Layers,
  Sparkles,
  Timer,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyOS — Your personal study operating system" },
      {
        name: "description",
        content:
          "Plan, learn, revise and track everything for your exams in one premium personal workspace. Subjects, topics, notes, flashcards, timers and progress analytics.",
      },
      { property: "og:title", content: "StudyOS — Your personal study operating system" },
      {
        property: "og:description",
        content:
          "Plan, learn, revise and track everything for your exams in one premium personal workspace. Subjects, topics, notes, flashcards, timers and progress analytics.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Layers, title: "Subjects → Units → Topics", desc: "Unlimited hierarchy with drag-free ordering, priorities and progress." },
  { icon: FileText, title: "Deep topic editor", desc: "22 structured sections from definition to 10-mark answers and MCQs." },
  { icon: Brain, title: "Flashcards & revision", desc: "Leitner spaced repetition with a revision calendar that tells you what's due." },
  { icon: Timer, title: "Focus timer", desc: "Pomodoro and stopwatch sessions logged to daily, weekly and monthly stats." },
  { icon: CalendarClock, title: "Exams & assignments", desc: "Countdowns, preparation levels, deadlines and priorities." },
  { icon: Sparkles, title: "AI study assistant", desc: "Generate notes, MCQs, viva questions, summaries and revision plans." },
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-3xl aurora-bg" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl aurora-bg">
            <BookOpen className="size-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">StudyOS</span>
        </div>
        <Button asChild variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="relative mx-auto max-w-3xl px-6 pt-16 pb-10 text-center animate-rise">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> Personal. Private. Yours only.
        </span>
        <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Your entire academic life,
          <br />
          <span className="aurora-text">in one operating system.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          StudyOS blends a knowledge base, planner, flashcard engine and exam-prep
          platform into a single workspace built for one person — you.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Start studying</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create account
            </Link>
          </Button>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="panel lift lift-hover p-5">
            <f.icon className="size-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="relative border-t border-border py-8 text-center text-xs text-muted-foreground">
        <LayoutDashboard className="mx-auto mb-2 size-4" />
        StudyOS — built for a single focused learner.
      </footer>
    </main>
  );
}
