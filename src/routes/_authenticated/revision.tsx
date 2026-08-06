import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useList, useUpdate, type Topic } from "@/lib/data";
import { nextRevisionDate } from "@/lib/topic-schema";
import { EmptyState, PageHeader, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/revision")({
  head: () => ({
    meta: [
      { title: "Revision — StudyOS" },
      { name: "description", content: "Spaced revision queue for topics that need another pass." },
      { property: "og:title", content: "Revision — StudyOS" },
      { property: "og:description", content: "Spaced revision queue for topics that need another pass." },
    ],
  }),
  component: RevisionPage,
});

function RevisionPage() {
  const topics = useList("topics", { build: (q) => q.order("next_revision_at") });
  const update = useUpdate("topics", { silent: true });

  const all = topics.data ?? [];
  const dueNow = all.filter(
    (t) => t.next_revision_at && new Date(t.next_revision_at).getTime() <= Date.now(),
  );
  const neverRevised = all.filter((t) => t.completed && !t.next_revision_at);
  const weak = all.filter((t) => t.weak);
  const queue = [...dueNow, ...neverRevised];

  function markRevised(t: Topic) {
    const count = (t.revision_count ?? 0) + 1;
    update.mutate({
      id: t.id,
      values: {
        revision_count: count,
        last_revised_at: new Date().toISOString(),
        next_revision_at: nextRevisionDate(count),
      },
    });
    toast.success("Revision logged");
  }

  return (
    <div className="animate-rise">
      <PageHeader title="Revision" subtitle="Your spaced repetition queue for topics" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Due today" value={queue.length} icon={CalendarCheck} accent="warning" />
        <StatCard label="Weak topics" value={weak.length} icon={TriangleAlert} accent="destructive" />
        <StatCard
          label="Total revisions"
          value={all.reduce((a, t) => a + (t.revision_count ?? 0), 0)}
          icon={RefreshCw}
          accent="success"
        />
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nothing due right now"
          description="Complete topics and log revisions — they'll reappear here on schedule."
        />
      ) : (
        <ul className="panel divide-y divide-border">
          {queue.map((t) => (
            <li key={t.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  to="/topics/$topicId"
                  params={{ topicId: t.id }}
                  className="truncate text-sm font-medium hover:text-primary"
                >
                  {t.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {t.revision_count} revisions ·{" "}
                  {t.last_revised_at
                    ? `last ${new Date(t.last_revised_at).toLocaleDateString()}`
                    : "never revised"}
                </p>
              </div>
              {t.weak && <Badge variant="outline" className="text-destructive">weak</Badge>}
              <Button size="sm" onClick={() => markRevised(t)}>
                <RefreshCw className="size-4" /> Revised
              </Button>
            </li>
          ))}
        </ul>
      )}

      {weak.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Weak topics
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {weak.map((t) => (
              <Link
                key={t.id}
                to="/topics/$topicId"
                params={{ topicId: t.id }}
                className="panel lift lift-hover p-4 text-sm"
              >
                <span className="font-medium">{t.title}</span>
                <p className="mt-1 text-xs text-muted-foreground capitalize">
                  {t.difficulty} · {t.priority} priority
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
