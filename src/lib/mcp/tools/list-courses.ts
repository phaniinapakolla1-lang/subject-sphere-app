import { z } from "zod";
import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

const toCourseJson = (row: {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  description: string | null;
  status: string;
  slug: string | null;
  is_course: boolean;
  semester: number | null;
}) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  category: row.category,
  description: row.description,
  status: row.status,
  slug: row.slug,
  is_course: row.is_course,
  semester: row.semester,
});

export default defineTool({
  name: "list_courses",
  title: "List courses",
  description:
    "List the study courses and subjects visible to the signed-in user, with publication status and topic progress counts.",
  inputSchema: {
    include_drafts: z
      .boolean()
      .optional()
      .describe("Include unpublished draft courses the user owns (admins see all drafts). Default false."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (args, ctx) => {
    const db = supabaseForUser(ctx);
    const { data: subjects, error } = await db
      .from("subjects")
      .select(
        "id,name,code,category,description,status,slug,is_course,semester,archived",
      )
      .order("position");
    if (error) throw new ToolError(`Could not list courses: ${error.message}`);

    let rows = subjects ?? [];
    rows = rows.filter((r) => !r.archived);
    if (!args.include_drafts) rows = rows.filter((r) => r.status === "published");

    const { data: topicRows, error: topicError } = await db
      .from("topics")
      .select("subject_id,completed");
    if (topicError) throw new ToolError(`Could not count topics: ${topicError.message}`);

    const counts = new Map<string, { total: number; done: number }>();
    for (const t of topicRows ?? []) {
      const c = counts.get(t.subject_id) ?? { total: 0, done: 0 };
      c.total += 1;
      if (t.completed) c.done += 1;
      counts.set(t.subject_id, c);
    }

    const courses = rows.map((r) => {
      const c = counts.get(r.id) ?? { total: 0, done: 0 };
      return { ...toCourseJson(r), topic_count: c.total, completed_topics: c.done };
    });

    const summary =
      courses.length === 0
        ? "No courses found."
        : courses
            .map((c) => `${c.name}${c.code ? ` (${c.code})` : ""} — ${c.status}, ${c.completed_topics}/${c.topic_count} topics done`)
            .join("\n");

    return {
      content: [{ type: "text", text: summary }],
      structuredContent: { courses },
    };
  },
});
