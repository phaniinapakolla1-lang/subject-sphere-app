import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/request-publish";
import { adminDecide, adminGetRequest, adminReviewChildren } from "@/lib/publishing.functions";

export const Route = createFileRoute("/_admin/admin/requests/$requestId")({
  head: () => ({
    meta: [
      { title: "Review Request — StudyOS Admin" },
      { name: "description", content: "Review a student's content before publishing it." },
      { property: "og:title", content: "Review Request — StudyOS Admin" },
      { property: "og:description", content: "Inspect the content tree and approve or send back." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewPage,
});

type Kind = "course" | "subject" | "unit" | "topic";
type Node = { id: string; kind: string; label: string; body?: string; published: boolean };

function TreeNode({ node }: { node: Node }) {
  const [open, setOpen] = useState(false);
  const fetchChildren = useServerFn(adminReviewChildren);
  const leaf = node.kind === "block";
  const kids = useQuery({
    queryKey: ["review-children", node.kind, node.id],
    enabled: open && !leaf,
    queryFn: () => fetchChildren({ data: { kind: node.kind as Kind, id: node.id } }) as Promise<Node[]>,
  });
  if (leaf)
    return (
      <div className="rounded-md border border-border/60 p-2 text-sm">
        <div className="text-xs font-medium uppercase text-muted-foreground">{node.label}</div>
        <div className="mt-1 line-clamp-4 whitespace-pre-wrap">{node.body}</div>
      </div>
    );
  return (
    <div>
      <button className="flex items-center gap-1 py-1 text-sm hover:text-primary" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span className="text-xs uppercase text-muted-foreground">{node.kind}</span>
        <span className="font-medium">{node.label}</span>
        {node.published && <span className="text-xs text-success">· published</span>}
      </button>
      {open && (
        <div className="ml-5 space-y-1 border-l border-border pl-3">
          {kids.isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : !kids.data?.length ? (
            <div className="text-xs text-muted-foreground">Empty</div>
          ) : (
            kids.data.map((k) => <TreeNode key={k.id} node={k} />)
          )}
        </div>
      )}
    </div>
  );
}

function ReviewPage() {
  const { requestId } = Route.useParams();
  const get = useServerFn(adminGetRequest);
  const decide = useServerFn(adminDecide);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const r = useQuery({ queryKey: ["admin-request", requestId], queryFn: () => get({ data: { id: requestId } }) });
  const [action, setAction] = useState<null | "approve" | "changes" | "reject">(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!action) return;
    setBusy(true);
    try {
      await decide({ data: { id: requestId, action, feedback } });
      toast.success(action === "approve" ? "Published" : action === "changes" ? "Changes requested" : "Rejected");
      qc.invalidateQueries({ queryKey: ["admin-requests"] });
      navigate({ to: "/admin/requests" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (r.isLoading) return <Loader2 className="mx-auto size-5 animate-spin" />;
  if (!r.data) return <div className="panel p-6 text-sm">Request not found.</div>;
  const d = r.data;
  const open = d.status === "pending_review";

  return (
    <div className="space-y-6">
      <Link to="/admin/requests" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All requests
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">#{d.number} · {d.title}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="capitalize">{d.scope_type}</span> by {d.requester_name} · {d.unit_count} units · {d.topic_count} topics
          </p>
          <div className="mt-2"><StatusBadge status={d.status} /></div>
          {d.feedback && <p className="mt-2 text-sm">Feedback: {d.feedback}</p>}
        </div>
        {open && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAction("reject")}>Reject</Button>
            <Button variant="outline" onClick={() => setAction("changes")}>Request changes</Button>
            <Button onClick={() => setAction("approve")}>Approve &amp; Publish</Button>
          </div>
        )}
      </div>

      <div className="panel space-y-1 p-4">
        {d.revision && (
          <p className="mb-2 text-sm text-primary">This is a revision (v{d.revision.version}) of a published topic — approving replaces the live content.</p>
        )}
        <TreeNode node={{ id: d.scope_id, kind: d.scope_type, label: d.title, published: false }} />
      </div>

      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve & publish?" : action === "changes" ? "Request changes" : "Reject request"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Everything in this scope becomes visible to all students."
                : action === "changes"
                  ? "Tell the student what to fix (required)."
                  : "Optionally give a reason."}
            </DialogDescription>
          </DialogHeader>
          {action !== "approve" && (
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback…" />
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={confirm} disabled={busy || (action === "changes" && !feedback.trim())}>
              {busy && <Loader2 className="size-4 animate-spin" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
