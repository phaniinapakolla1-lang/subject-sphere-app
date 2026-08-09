import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  BookOpen,
  Layers,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { adminOverview } from "@/lib/admin.functions";
import { PageHeader, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_admin/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin overview — StudyOS" },
      { name: "description", content: "Platform overview of StudyOS student accounts and activity." },
      { property: "og:title", content: "Admin overview — StudyOS" },
      { property: "og:description", content: "Student accounts, activity and content at a glance." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchOverview = useServerFn(adminOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview(),
  });

  return (
    <>
      <PageHeader
        title="Platform overview"
        subtitle="Accounts, access and content across StudyOS."
        actions={
          <Button asChild>
            <Link to="/admin/students">
              <UserPlus className="size-4" /> Manage students
            </Link>
          </Button>
        }
      />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Students" value={data.totalStudents} icon={Users} />
          <StatCard label="Active" value={data.activeStudents} icon={UserCheck} accent="success" />
          <StatCard label="Suspended" value={data.suspendedStudents} icon={UserX} accent="destructive" />
          <StatCard label="New this week" value={data.newThisWeek} icon={UserPlus} accent="warning" />
          <StatCard label="Active this week" value={data.activeThisWeek} icon={Activity} />
          <StatCard label="Administrators" value={data.admins} icon={ShieldCheck} />
          <StatCard label="Subjects created" value={data.subjects} icon={Layers} />
          <StatCard label="Topics created" value={data.topics} icon={BookOpen} />
        </div>
      )}

      <div className="panel mt-6 p-6">
        <h2 className="text-sm font-semibold">Access model</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Public sign-up is disabled — only administrators create student accounts.</li>
          <li>• Every student sees only their own data, enforced at the database level.</li>
          <li>• Visitors can explore a demo workspace that never touches real data.</li>
        </ul>
      </div>
    </>
  );
}
