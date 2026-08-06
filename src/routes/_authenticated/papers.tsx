import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileStack, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCreate, useList, useRemove } from "@/lib/data";
import { EmptyState, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/_authenticated/papers")({
  head: () => ({
    meta: [
      { title: "Question Papers — StudyOS" },
      { name: "description", content: "Archive of previous year papers and model questions." },
      { property: "og:title", content: "Question Papers — StudyOS" },
      { property: "og:description", content: "Archive of previous year papers and model questions." },
    ],
  }),
  component: PapersPage,
});

const CATEGORIES = ["previous_year", "model", "internal", "practice"];

function PapersPage() {
  const { user } = useAuth();
  const papers = useList("papers", { build: (q) => q.order("year", { ascending: false }) });
  const create = useCreate("papers", "Paper added");
  const remove = useRemove("papers", "Paper removed");

  const [dialog, setDialog] = useState(false);
  const [draft, setDraft] = useState({ title: "", url: "", year: "", category: "previous_year" });

  async function add() {
    if (!user || !draft.title.trim()) return;
    await create.mutateAsync({
      user_id: user.id,
      title: draft.title.trim(),
      url: draft.url || null,
      year: draft.year ? Number(draft.year) : null,
      category: draft.category,
    });
    setDraft({ title: "", url: "", year: "", category: "previous_year" });
    setDialog(false);
  }

  const all = papers.data ?? [];

  return (
    <div className="animate-rise">
      <PageHeader
        title="Question Papers"
        subtitle="Previous year and model papers in one archive"
        actions={
          <Button onClick={() => setDialog(true)}>
            <Plus className="size-4" /> Add paper
          </Button>
        }
      />

      {all.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="No papers yet"
          description="Collect previous year papers so you always know what gets asked."
          action={<Button onClick={() => setDialog(true)}>Add a paper</Button>}
        />
      ) : (
        <ul className="panel divide-y divide-border">
          {all.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-4">
              <Badge variant="outline" className="capitalize">
                {p.category.replace("_", " ")}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
              {p.year && <span className="text-xs text-muted-foreground">{p.year}</span>}
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Open
                </a>
              )}
              <Button variant="ghost" size="icon" aria-label="Delete paper" onClick={() => remove.mutate(p.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add paper</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input
                value={draft.url}
                placeholder="https://…"
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={draft.year}
                  onChange={(e) => setDraft({ ...draft, year: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button onClick={add}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
