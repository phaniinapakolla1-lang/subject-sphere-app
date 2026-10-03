import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { previewPublish, requestPublish, type Scope } from "@/lib/publishing.functions";
import { demoGuard } from "@/lib/data";

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  changes_requested: "Changes requested",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
};

export const REQUEST_STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-warning/15 text-warning",
  changes_requested: "bg-primary/15 text-primary",
  approved: "bg-success/15 text-success",
  published: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${REQUEST_STATUS_TONE[status] ?? ""}`}>
      {REQUEST_STATUS_LABEL[status] ?? status}
    </span>
  );
}

const SCOPE_LABEL: Record<Scope, string> = { topic: "Topic", unit: "Unit", subject: "Subject", course: "Course" };

export function RequestPublishButton({
  scope,
  id,
  size = "sm",
}: {
  scope: Scope;
  id: string;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const preview = useServerFn(previewPublish);
  const submit = useServerFn(requestPublish);
  const info = useQuery({
    queryKey: ["publish-preview", scope, id],
    enabled: open,
    queryFn: () => preview({ data: { scope, id } }),
  });

  async function onSubmit() {
    setBusy(true);
    try {
      await submit({ data: { scope, id } });
      toast.success("Request sent for admin review");
      qc.invalidateQueries({ queryKey: ["my-requests"] });
      qc.invalidateQueries({ queryKey: ["publish-preview"] });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit request");
    } finally {
      setBusy(false);
    }
  }

  const d = info.data;
  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={() => {
          if (demoGuard()) return;
          setOpen(true);
        }}
      >
        <Send className="size-4" /> Request to Publish {SCOPE_LABEL[scope]}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Publish</DialogTitle>
            <DialogDescription>An admin will review it before it appears in the Published Library.</DialogDescription>
          </DialogHeader>
          {info.isLoading || !d ? (
            <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin" /></div>
          ) : (
            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Scope</dt><dd>{SCOPE_LABEL[scope]}</dd>
              <dt className="text-muted-foreground">Content</dt><dd className="font-medium">{d.title}</dd>
              {scope !== "topic" && (<><dt className="text-muted-foreground">Units</dt><dd>{d.units}</dd></>)}
              <dt className="text-muted-foreground">Topics</dt><dd>{d.topics}</dd>
              {d.latest && (<><dt className="text-muted-foreground">Last request</dt><dd><StatusBadge status={d.latest.status} /></dd></>)}
              {d.latest?.feedback && (<><dt className="text-muted-foreground">Feedback</dt><dd>{d.latest.feedback}</dd></>)}
            </dl>
          )}
          {d && !d.canRequest && (
            <p className="text-sm text-destructive">Only the creator of this content can request publication.</p>
          )}
          <DialogFooter>
            <Button variant="ghost" asChild><Link to="/publishing">My requests</Link></Button>
            <Button onClick={onSubmit} disabled={busy || !d?.canRequest || d?.latest?.status === "pending_review"}>
              {busy && <Loader2 className="size-4 animate-spin" />} Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
