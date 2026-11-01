import { z } from "zod";
import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_planner_slots",
  title: "List planner slots",
  description:
    "List the signed-in user's study-planner slots for the coming days, including planned topic, duration and status.",
  inputSchema: {
    days: z
      .number()
      .int()
      .min(1)
      .max(30)
      .optional()
      .describe("How many days ahead to include, starting today (default 7)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (args, ctx) => {
    const db = supabaseForUser(ctx);
    const today = new Date().toISOString().slice(0, 10);
    const until = new Date(Date.now() + (args.days ?? 7) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const { data, error } = await db
      .from("planner_slots")
      .select("id,title,notes,slot_date,start_time,duration_minutes,status,due_at,subject_id,topic_id")
      .gte("slot_date", today)
      .lte("slot_date", until)
      .order("slot_date")
      .order("start_time");
    if (error) throw new ToolError(`Could not list planner slots: ${error.message}`);

    const slots = (data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      notes: s.notes,
      slot_date: s.slot_date,
      start_time: s.start_time,
      duration_minutes: s.duration_minutes,
      status: s.status,
      due_at: s.due_at,
      subject_id: s.subject_id,
      topic_id: s.topic_id,
    }));

    const summary =
      slots.length === 0
        ? `No planner slots between ${today} and ${until}.`
        : slots
            .map(
              (s) =>
                `${s.slot_date}${s.start_time ? ` ${s.start_time}` : ""} — ${s.title} (${s.duration_minutes} min, ${s.status})`,
            )
            .join("\n");

    return {
      content: [{ type: "text", text: summary }],
      structuredContent: { slots },
    };
  },
});
