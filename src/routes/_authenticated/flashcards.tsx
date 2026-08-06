import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Brain, Plus, RotateCw, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCreate, useList, useRemove, useUpdate, type Flashcard } from "@/lib/data";
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

export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards — StudyOS" },
      { name: "description", content: "Spaced repetition flashcards with Leitner boxes." },
      { property: "og:title", content: "Flashcards — StudyOS" },
      { property: "og:description", content: "Spaced repetition flashcards with Leitner boxes." },
    ],
  }),
  component: FlashcardsPage,
});

const BOX_DAYS = [0, 1, 3, 7, 16, 35];

function dueDate(box: number) {
  const d = new Date();
  d.setDate(d.getDate() + (BOX_DAYS[Math.min(box, BOX_DAYS.length - 1)] ?? 35));
  return d.toISOString();
}

function FlashcardsPage() {
  const { user } = useAuth();
  const cards = useList("flashcards", { build: (q) => q.order("due_at") });
  const subjects = useList("subjects", { build: (q) => q.order("position") });
  const create = useCreate("flashcards", "Card added");
  const update = useUpdate("flashcards", { silent: true });
  const remove = useRemove("flashcards", "Card deleted");

  const [dialog, setDialog] = useState(false);
  const [draft, setDraft] = useState({ question: "", answer: "", subject_id: "none" });
  const [studying, setStudying] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const all = cards.data ?? [];
  const due = useMemo(
    () => all.filter((c) => new Date(c.due_at).getTime() <= Date.now()),
    [all],
  );

  async function addCard() {
    if (!user || !draft.question.trim() || !draft.answer.trim()) return;
    await create.mutateAsync({
      user_id: user.id,
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      subject_id: draft.subject_id === "none" ? null : draft.subject_id,
      due_at: new Date().toISOString(),
    });
    setDraft({ question: "", answer: "", subject_id: "none" });
    setDialog(false);
  }

  function grade(card: Flashcard, known: boolean) {
    const box = known ? Math.min(card.box + 1, 5) : 1;
    update.mutate({
      id: card.id,
      values: {
        box,
        due_at: dueDate(box),
        reviews: card.reviews + 1,
        last_reviewed_at: new Date().toISOString(),
      },
    });
    setFlipped(false);
    if (index + 1 >= due.length) {
      setStudying(false);
      setIndex(0);
    } else {
      setIndex(index + 1);
    }
  }

  const current = due[index];

  return (
    <div className="animate-rise">
      <PageHeader
        title="Flashcards"
        subtitle="Leitner spaced repetition — review only what's due"
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog(true)}>
              <Plus className="size-4" /> New card
            </Button>
            <Button
              disabled={due.length === 0}
              onClick={() => {
                setStudying(true);
                setIndex(0);
                setFlipped(false);
              }}
            >
              <Brain className="size-4" /> Study {due.length} due
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total cards" value={all.length} icon={Brain} />
        <StatCard label="Due now" value={due.length} icon={RotateCw} accent="warning" />
        <StatCard
          label="Mastered (box 5)"
          value={all.filter((c) => c.box >= 5).length}
          icon={Brain}
          accent="success"
        />
      </div>

      {studying && current ? (
        <div className="panel mx-auto max-w-2xl p-8 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Card {index + 1} of {due.length} · Box {current.box}
          </p>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="mt-6 flex min-h-40 w-full items-center justify-center rounded-xl border border-border bg-card p-6 text-lg"
          >
            {flipped ? current.answer : current.question}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">Click the card to flip</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={() => grade(current, false)}>
              Again
            </Button>
            <Button onClick={() => grade(current, true)}>Got it</Button>
          </div>
          <Button variant="ghost" className="mt-4" onClick={() => setStudying(false)}>
            End session
          </Button>
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No flashcards yet"
          description="Turn tricky topics into questions and let spaced repetition do the rest."
          action={<Button onClick={() => setDialog(true)}>Create a card</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {all.map((c) => (
            <div key={c.id} className="panel lift lift-hover p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{c.question}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete card"
                  onClick={() => remove.mutate(c.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.answer}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary">Box {c.box}</Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    new Date(c.due_at).getTime() <= Date.now() && "border-warning text-warning",
                  )}
                >
                  Due {new Date(c.due_at).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New flashcard</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea
                rows={4}
                value={draft.answer}
                onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
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
            <Button onClick={addCard}>Add card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
