import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarClock,
  FileText,
  Layers,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Timer,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { startDemo } from "@/lib/demo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyOS — Study smarter with one connected workspace" },
      {
        name: "description",
        content:
          "StudyOS unifies subjects, topics, notes, flashcards, focus timers, exams and an AI study coach. Try the full demo free — no sign-up required.",
      },
      { property: "og:title", content: "StudyOS — Study smarter with one connected workspace" },
      {
        property: "og:description",
        content:
          "Subjects, notes, flashcards, revision, exams and an AI coach in one premium workspace. Explore the free demo instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Layers, title: "Subjects → Units → Topics", desc: "A clean hierarchy with priorities, ordering and live progress." },
  { icon: FileText, title: "Deep topic editor", desc: "22 structured sections from definition to 10-mark answers and MCQs." },
  { icon: Brain, title: "Flashcards & revision", desc: "Leitner spaced repetition plus a queue that tells you what is due today." },
  { icon: Timer, title: "Focus timer", desc: "Pomodoro and stopwatch sessions logged into daily and weekly analytics." },
  { icon: CalendarClock, title: "Exams & assignments", desc: "Countdowns, preparation levels, deadlines and kanban tracking." },
  { icon: Sparkles, title: "AI study assistant", desc: "Generate summaries, MCQs, viva questions and revision plans in seconds." },
];

const STEPS = [
  { n: "01", title: "Explore the demo", desc: "Open a fully populated sample workspace instantly — no account, no email, nothing to install." },
  { n: "02", title: "Get your student account", desc: "Your administrator creates your account and hands you secure credentials." },
  { n: "03", title: "Build your own system", desc: "Add subjects, capture topics, revise with flashcards and track every exam." },
];

function Landing() {
  const { user, demo } = useAuth();
  const navigate = useNavigate();

  function tryDemo() {
    startDemo();
    window.location.href = "/dashboard";
  }

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
        <nav className="flex items-center gap-2">
          {user || demo ? (
            <Button onClick={() => navigate({ to: "/dashboard" })}>
              Open workspace <ArrowRight className="size-4" />
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/admin">
                  <ShieldCheck className="size-4" /> Admin
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/student-login">Student login</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <section className="relative mx-auto max-w-3xl px-6 pt-14 pb-10 text-center animate-rise">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> Free demo — no sign-up required
        </span>
        <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Your entire academic life,
          <br />
          <span className="aurora-text">in one operating system.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          StudyOS blends a knowledge base, planner, flashcard engine and exam-prep
          platform into a single focused workspace. Explore everything with sample data
          before you ever create an account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={tryDemo}>
            <PlayCircle className="size-4" /> Try free demo
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/student-login">
              <UserPlus className="size-4" /> Student login
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Demo data lives only in your browser and is never saved.
        </p>
      </section>

      <section className="relative mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="panel p-5">
              <span className="aurora-text text-2xl font-semibold">{s.n}</span>
              <h3 className="mt-2 text-sm font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto grid max-w-5xl gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="panel lift lift-hover p-5">
            <f.icon className="size-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="relative mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="panel p-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            See it before you sign in
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The demo workspace is preloaded with five subjects, topics, flashcards,
            assignments and exam countdowns.
          </p>
          <Button size="lg" className="mt-6" onClick={tryDemo}>
            <PlayCircle className="size-4" /> Launch demo workspace
          </Button>
        </div>
      </section>

      <footer className="relative border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>StudyOS — a focused study operating system for students.</p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <Link to="/student-login" className="hover:text-foreground">
            Student login
          </Link>
          <Link to="/admin" className="inline-flex items-center gap-1 hover:text-foreground">
            <ShieldCheck className="size-3.5" /> Admin portal
          </Link>
        </div>
      </footer>
    </main>
  );
}
