import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  CalendarClock,
  ClipboardList,
  FileStack,
  Layers,
  NotebookPen,
  FileText,
} from "lucide-react";
import { db } from "@/lib/data";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Hit = {
  id: string;
  label: string;
  sub?: string | undefined;
  group: string;
  icon: React.ElementType;
  go: () => void;
};

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 200);
    return () => clearTimeout(t);
  }, [term]);

  const { data } = useQuery({
    queryKey: ["search", debounced],
    enabled: open && debounced.length > 1,
    queryFn: async () => {
      const like = `%${debounced}%`;
      const [subjects, units, topics, notes, cards, assignments, exams, papers] =
        await Promise.all([
          db("subjects").select("id,name,code").ilike("name", like).limit(5),
          db("units").select("id,name,subject_id").ilike("name", like).limit(5),
          db("topics").select("id,title,subject_id").ilike("title", like).limit(8),
          db("notes").select("id,title").ilike("title", like).limit(5),
          db("flashcards").select("id,question").ilike("question", like).limit(5),
          db("assignments").select("id,title").ilike("title", like).limit(5),
          db("exams").select("id,name").ilike("name", like).limit(5),
          db("papers").select("id,title").ilike("title", like).limit(5),
        ]);

      const hits: Hit[] = [];
      subjects.data?.forEach((s) =>
        hits.push({
          id: s.id,
          label: s.name,
          sub: s.code ?? undefined,
          group: "Subjects",
          icon: Layers,
          go: () => navigate({ to: "/subjects/$subjectId", params: { subjectId: s.id } }),
        }),
      );
      units.data?.forEach((u) =>
        hits.push({
          id: u.id,
          label: u.name,
          group: "Units",
          icon: FileText,
          go: () =>
            navigate({ to: "/subjects/$subjectId", params: { subjectId: u.subject_id } }),
        }),
      );
      topics.data?.forEach((t) =>
        hits.push({
          id: t.id,
          label: t.title,
          group: "Topics",
          icon: FileText,
          go: () => navigate({ to: "/topics/$topicId", params: { topicId: t.id } }),
        }),
      );
      notes.data?.forEach((n) =>
        hits.push({
          id: n.id,
          label: n.title,
          group: "Notes",
          icon: NotebookPen,
          go: () => navigate({ to: "/notes" }),
        }),
      );
      cards.data?.forEach((c) =>
        hits.push({
          id: c.id,
          label: c.question,
          group: "Flashcards",
          icon: Brain,
          go: () => navigate({ to: "/flashcards" }),
        }),
      );
      assignments.data?.forEach((a) =>
        hits.push({
          id: a.id,
          label: a.title,
          group: "Assignments",
          icon: ClipboardList,
          go: () => navigate({ to: "/assignments" }),
        }),
      );
      exams.data?.forEach((e) =>
        hits.push({
          id: e.id,
          label: e.name,
          group: "Exams",
          icon: CalendarClock,
          go: () => navigate({ to: "/exams" }),
        }),
      );
      papers.data?.forEach((p) =>
        hits.push({
          id: p.id,
          label: p.title,
          group: "Papers",
          icon: FileStack,
          go: () => navigate({ to: "/papers" }),
        }),
      );
      return hits;
    },
  });

  const groups = Array.from(new Set((data ?? []).map((h) => h.group)));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search subjects, topics, notes, flashcards…"
        value={term}
        onValueChange={setTerm}
      />
      <CommandList>
        <CommandEmpty>
          {debounced.length > 1 ? "No matches found." : "Type at least 2 characters."}
        </CommandEmpty>
        {groups.map((g) => (
          <CommandGroup key={g} heading={g}>
            {(data ?? [])
              .filter((h) => h.group === g)
              .map((h) => (
                <CommandItem
                  key={`${g}-${h.id}`}
                  value={`${g}-${h.id}-${h.label}`}
                  onSelect={() => {
                    onOpenChange(false);
                    h.go();
                  }}
                >
                  <h.icon className="size-4 text-muted-foreground" />
                  <span className="truncate">{h.label}</span>
                  {h.sub && (
                    <span className="ml-auto text-xs text-muted-foreground">{h.sub}</span>
                  )}
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
