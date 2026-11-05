import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const COURSE_COLUMNS =
  "id, name, slug, code, description, category, level, color, thumbnail_url, duration, academic_year, semester, credits, status, visibility, learning_outcomes, published_at";

export const listPublicCourses = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("subjects")
    .select(COURSE_COLUMNS)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false })
    .limit(60);
  if (error) return { courses: [] };
  return { courses: data ?? [] };
});

export const getPublicCourse = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input?.slug ?? "").slice(0, 120) }))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    // Subjects without a generated slug fall back to their id so catalog links never dead-end.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.slug);
    const { data: course } = await supabase
      .from("subjects")
      .select(COURSE_COLUMNS)
      .eq(isUuid ? "id" : "slug", data.slug)
      .eq("status", "published")
      .eq("visibility", "public")
      .maybeSingle();
    if (!course) return { course: null, units: [], topics: [] };

    const [{ data: units }, { data: topics }] = await Promise.all([
      supabase
        .from("units")
        .select("id, name, description, position")
        .eq("subject_id", course.id)
        .order("position", { ascending: true }),
      supabase
        .from("topics")
        .select("id, title, unit_id, position, estimated_minutes")
        .eq("subject_id", course.id)
        .order("position", { ascending: true }),
    ]);

    return { course, units: units ?? [], topics: topics ?? [] };
  });
