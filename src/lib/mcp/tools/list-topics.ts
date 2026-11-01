import { z } from "zod";
import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_topics",
  title: "List topics",
  description:
    "List study topics visible to the signed-in user, optionally filtered by course, a title search, or draft visibility.",
  inputSchema: {
    subject_id: z.string().uuid().optional().describe("Only topics inside this course/subject."),
    search: z.string().min(1).max(200).optional().describe("Case-insensitive match on the topic title."),
    include_drafts: z
      .boolean()
      .optional()
      .describe("Include unpublished draft topics (only visible when the user may read them). Default false."),
    limit: z.number().int().min(1).max(100).optional().describe("Maximum topics to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (args, ctx) => {
    const db = supabaseForUser(ctx);
    let query = db
      .from("topics")
      .select(
        "id,title,subject_id,unit_id,description,estimated_minutes,difficulty,published,completed,bookmarked,weak,updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(args.limit ?? 50);

    if (args.subject_id) query = query.eq("subject_id", args.subject_id);
    if (args.search) query = query.ilike("title", `%${args.search}%`);

    const { data, error } = await query;
    if (error) throw new ToolError(`Could not list topics: ${error.message}`);

    let rows = data ?? [];
    if (!args.include_drafts) rows = rows.filter((r) => r.published);

    const topics = rows.map((t) => ({
      id: t.id,
      title: t.title,
      subject_id: t.subject_id,
      unit_id: t.unit_id,
      description: t.description,
      estimated_minutes: t.estimated_minutes,
      difficulty: t.difficulty,
      published: t.published,
      completed: t.completed,
      bookmarked: t.bookmarked,
      weak: t.weak,
    }));

    const summary =
      topics.length === 0
        ? "No topics found for this filter."
        : topics
            .map(
              (t) =>
                `${t.id} — ${t.title}${t.completed ? " [done]" : ""}${t.weak ? " [weak]" : ""}${t.bookmarked ? " [bookmarked]" : ""}`,
            )
            .join("\n");

    return {
      content: [{ type: "text", text: summary }],
      structuredContent: { topics },
    };
  },
});
