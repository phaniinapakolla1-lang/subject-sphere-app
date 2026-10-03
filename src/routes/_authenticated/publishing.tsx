import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/request-publish";
import { listMyRequests, resubmitRequest } from "@/lib/publishing.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/publishing")({
  head: () => ({
    meta: [
      { title: "My Publishing Requests — StudyOS" },
      { name: "description", content: "Track the review status of content you submitted for publication." },
      { property: "og:title", content: "My Publishing Requests — StudyOS" },
      { property: "og:description", content: "Track your publication requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyRequests,
});

function editLink(r: { scope_type: string; scope_id: string }) {
  if (r.scope_type === "topic") return { to: "/topics/$topicId", params: { topicId: r.scope_id } } as const;
  if (r.scope_type === "subject") return { to: "/subjects/$subjectId", params: { subjectId: r.scope_id } } as const;
  return null;
}

function MyRequests() {
  const { demo } = useAuth();
  const fetchMine = useServerFn(listMyRequests);
  const resubmit = useServerFn(resubmitRequest);
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["my-requests"], enabled: !demo, queryFn: () => fetchMine() });

  async function doResubmit(id: string) {
    try {
      await resubmit({ data: { id } });
      toast.success("Resubmitted for review");
      qc.invalidateQueries({ queryKey: ["my-requests"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resubmit");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Publishing Requests</h1>
        <p className="text-sm text-muted-foreground">Content you've submitted for admin review.</p>
      </div>
      {demo ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">This feature is available after creating an account.</div>
      ) : q.isLoading ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : !q.data?.length ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">
          No requests yet. Use "Request to Publish" on any topic or subject you created.
        </div>
      ) : (
        <div className="space-y-3">
          {q.data.map((r) => {
            const link = editLink(r);
            return (
              <div key={r.id} className="panel p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{r.scope_type}</span>
                  <span className="font-medium">{r.title}</span>
                  <StatusBadge status={r.status} />
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setOpen(open === r.id ? null : r.id)}>
                    {open === r.id ? "Hide" : "View request"}
                  </Button>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Submitted {new Date(r.submitted_at).toLocaleString()} · Updated {new Date(r.updated_at).toLocaleString()}
                </div>
                {open === r.id && (
                  <div className="mt-3 grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                    <span className="text-muted-foreground">Request</span><span>#{r.number}</span>
                    <span className="text-muted-foreground">Units</span><span>{r.unit_count}</span>
                    <span className="text-muted-foreground">Topics</span><span>{r.topic_count}</span>
                  </div>
                )}
                {r.feedback && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">Admin feedback</div>
                    <p className="mt-1">{r.feedback}</p>
                  </div>
                )}
                {r.status === "changes_requested" && (
                  <div className="mt-3 flex gap-2">
                    {link && (
                      <Button variant="outline" size="sm" asChild>
                        <Link {...link}>Edit Content</Link>
                      </Button>
                    )}
                    <Button size="sm" onClick={() => doResubmit(r.id)}>Resubmit</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
