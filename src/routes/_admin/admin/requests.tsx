import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/request-publish";
import { adminListRequests } from "@/lib/publishing.functions";

export const Route = createFileRoute("/_admin/admin/requests")({
  head: () => ({
    meta: [
      { title: "Publishing Requests — StudyOS Admin" },
      { name: "description", content: "Review student requests to publish their content." },
      { property: "og:title", content: "Publishing Requests — StudyOS Admin" },
      { property: "og:description", content: "Approve, reject or request changes on student content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestsPage,
});

const FILTERS = ["all", "pending_review", "changes_requested", "published", "rejected"];

function RequestsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [status, setStatus] = useState("pending_review");
  const list = useServerFn(adminListRequests);
  const q = useQuery({ queryKey: ["admin-requests", status], queryFn: () => list({ data: { status } }) });
  if (pathname !== "/admin/requests") return <Outlet />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Publishing requests</h1>
        <p className="text-sm text-muted-foreground">Students' content waiting for review.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={status === f ? "default" : "outline"} onClick={() => setStatus(f)}>
            {f === "all" ? "All" : <StatusBadge status={f} />}
          </Button>
        ))}
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr className="border-b border-border">
              {["#", "Requester", "Scope", "Content", "Units", "Topics", "Submitted", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : !q.data?.length ? (
              <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No requests.</td></tr>
            ) : (
              q.data.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-3 py-2">{r.number}</td>
                  <td className="px-3 py-2">{r.requester_name}</td>
                  <td className="px-3 py-2 capitalize">{r.scope_type}</td>
                  <td className="px-3 py-2 font-medium">{r.title}</td>
                  <td className="px-3 py-2">{r.unit_count}</td>
                  <td className="px-3 py-2">{r.topic_count}</td>
                  <td className="px-3 py-2">{new Date(r.submitted_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/admin/requests/$requestId" params={{ requestId: r.id }}>Review</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
