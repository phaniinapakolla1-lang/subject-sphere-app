import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BookOpen, Clock, GraduationCap, Layers } from "lucide-react";
import { getPublicCourse } from "@/lib/catalog.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ params }) => {
    const result = await getPublicCourse({ data: { slug: params.slug } });
    if (!result.course) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.course)
      return {
        meta: [
          { title: "Course unavailable — Subject Sphere" },
          { name: "robots", content: "noindex" },
        ],
      };
    const c = loaderData.course;
    const description = (c.description ?? `${c.name} course outline on Subject Sphere.`).slice(
      0,
      155,
    );
    return {
      meta: [
        { title: `${c.name} — Subject Sphere` },
        { name: "description", content: description },
        { property: "og:title", content: `${c.name} — Subject Sphere` },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(c.thumbnail_url?.startsWith("https://")
          ? [
              { property: "og:image", content: c.thumbnail_url },
              { name: "twitter:image", content: c.thumbnail_url },
            ]
          : []),
      ],
    };
  },
  errorComponent: () => (
    <Shell>
      <p className="text-sm text-muted-foreground">This course could not be loaded.</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <h1 className="text-2xl font-semibold">Course not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        It may have been unpublished or made private.
      </p>
      <Button asChild className="mt-6">
        <Link to="/courses">Back to catalog</Link>
      </Button>
    </Shell>
  ),
  component: CoursePage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">{children}</main>;
}

type CourseDetail = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  category: string | null;
  level: string;
  duration: string | null;
  academic_year: string | null;
  thumbnail_url: string | null;
  learning_outcomes: string[];
};
type UnitRow = { id: string; name: string; description: string | null; position: number };
type TopicRow = { id: string; title: string; unit_id: string; position: number };

function CoursePage() {
  const { course, units, topics } = Route.useLoaderData() as {
    course: CourseDetail | null;
    units: UnitRow[];
    topics: TopicRow[];
  };
  if (!course) return null;

  return (
    <Shell>
      <Link to="/courses" className="text-sm text-muted-foreground hover:text-foreground">
        ← Course catalog
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {course.category && <Badge variant="secondary">{course.category}</Badge>}
          <Badge variant="outline">{course.level}</Badge>
          {course.code && <Badge variant="outline">{course.code}</Badge>}
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{course.name}</h1>
        {course.description && (
          <p className="mt-3 max-w-2xl text-muted-foreground">{course.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-4" /> {units.length} units
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-4" /> {topics.length} topics
          </span>
          {course.duration && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" /> {course.duration}
            </span>
          )}
          {course.academic_year && (
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="size-4" /> {course.academic_year}
            </span>
          )}
        </div>
      </header>

      {course.learning_outcomes?.length > 0 && (
        <section className="panel mt-8 p-5">
          <h2 className="text-sm font-semibold">What you'll learn</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {course.learning_outcomes.map((o: string) => (
              <li key={o} className="text-sm text-muted-foreground">
                • {o}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Curriculum</h2>
        <div className="space-y-3">
          {units.map((u, i) => {
            const unitTopics = topics.filter((t) => t.unit_id === u.id);
            return (
              <div key={u.id} className="panel p-5">
                <h3 className="font-medium">
                  {i + 1}. {u.name}
                </h3>
                {u.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{u.description}</p>
                )}
                <ul className="mt-3 space-y-1">
                  {unitTopics.map((t) => (
                    <li key={t.id} className="text-sm text-muted-foreground">
                      — {t.title}
                    </li>
                  ))}
                  {unitTopics.length === 0 && (
                    <li className="text-sm text-muted-foreground">No topics listed yet.</li>
                  )}
                </ul>
              </div>
            );
          })}
          {units.length === 0 && (
            <p className="panel p-8 text-center text-sm text-muted-foreground">
              The curriculum is still being prepared.
            </p>
          )}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/student-login">Sign in to start learning</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Try the free demo</Link>
        </Button>
      </div>
    </Shell>
  );
}
