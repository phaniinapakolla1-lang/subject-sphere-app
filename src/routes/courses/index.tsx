import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Clock, Layers } from "lucide-react";
import { listPublicCourses } from "@/lib/catalog.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/courses/")({
  loader: () => listPublicCourses(),
  head: () => ({
    meta: [
      { title: "Course catalog — Subject Sphere" },
      {
        name: "description",
        content:
          "Browse published courses on Subject Sphere: units, topics and structured study material built by your faculty.",
      },
      { property: "og:title", content: "Course catalog — Subject Sphere" },
      { property: "og:description", content: "Published courses with full unit and topic breakdowns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <Shell>
      <p className="text-sm text-muted-foreground">The catalog could not be loaded right now.</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <p className="text-sm text-muted-foreground">No catalog here.</p>
    </Shell>
  ),
  component: CatalogPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">{children}</main>;
}

function CatalogPage() {
  const { courses } = Route.useLoaderData() as {
    courses: Record<string, string | number | null>[];
  };

  return (
    <Shell>
      <div className="mb-10">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Subject Sphere
        </Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Course catalog</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every published course, with its full unit and topic breakdown. Sign in with your student
          account to open the course content.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="panel p-12 text-center">
          <GraduationCap className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No public courses have been published yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              to="/courses/$slug"
              params={{ slug: c.slug ?? "" }}
              className="panel lift lift-hover overflow-hidden"
            >
              <div className="h-24 w-full" style={{ background: c.color ?? "var(--primary)" }} />
              <div className="space-y-2 p-5">
                <div className="flex items-center gap-2">
                  {c.category && <Badge variant="secondary">{c.category}</Badge>}
                  <Badge variant="outline">{c.level}</Badge>
                </div>
                <h2 className="font-semibold tracking-tight">{c.name}</h2>
                <p className="line-clamp-3 text-sm text-muted-foreground">{c.description}</p>
                <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                  {c.duration && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" /> {c.duration}
                    </span>
                  )}
                  {c.credits && (
                    <span className="inline-flex items-center gap-1">
                      <Layers className="size-3.5" /> {c.credits} credits
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Button asChild variant="outline">
          <Link to="/student-login">Student sign in</Link>
        </Button>
      </div>
    </Shell>
  );
}
