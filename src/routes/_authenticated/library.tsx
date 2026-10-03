import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useList } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Published Library — StudyOS" },
      { name: "description", content: "Browse admin-approved courses, subjects and topics shared with all students." },
      { property: "og:title", content: "Published Library — StudyOS" },
      { property: "og:description", content: "Global students' published content, reviewed by admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Library,
});

function Library() {
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("all");
  const [category, setCategory] = useState("all");
  const subjects = useList("subjects", {
    key: ["library"],
    build: (b) => b.eq("status", "published").order("name"),
  });
  const courses = useList("courses", { key: ["library"], build: (b) => b.order("name") });
  const topics = useList("topics", {
    key: ["library-search", q],
    enabled: q.trim().length > 1,
    build: (b) => b.eq("published", true).ilike("title", `%${q.trim()}%`).limit(30),
  });

  const categories = useMemo(
    () => [...new Set((subjects.data ?? []).map((s) => s.category).filter(Boolean))] as string[],
    [subjects.data],
  );
  const list = (subjects.data ?? []).filter(
    (s) =>
      (course === "all" || s.course_id === course) &&
      (category === "all" || s.category === category) &&
      (!q.trim() || s.name.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Published Library</h1>
        <p className="text-sm text-muted-foreground">Global students' published content — approved by admins, read-only.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search subjects and topics…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="rounded-md border border-input bg-background px-3 text-sm" value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="all">All courses</option>
          {(courses.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="rounded-md border border-input bg-background px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {!!topics.data?.length && (
        <div className="panel p-4">
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Matching topics</div>
          <ul className="space-y-1">
            {topics.data.map((t) => (
              <li key={t.id}>
                <Link to="/topics/$topicId" params={{ topicId: t.id }} className="text-sm hover:text-primary">{t.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {subjects.isLoading ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : !list.length ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">No published content matches.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <Link key={s.id} to="/subjects/$subjectId" params={{ subjectId: s.id }} className="panel p-5 transition hover:-translate-y-0.5">
              <BookOpen className="size-5 text-primary" />
              <div className="mt-3 font-semibold">{s.name}</div>
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description || "No description"}</div>
              <div className="mt-3 text-xs text-muted-foreground">
                {(courses.data ?? []).find((c) => c.id === s.course_id)?.name ?? "Independent subject"}
                {s.category ? ` · ${s.category}` : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
