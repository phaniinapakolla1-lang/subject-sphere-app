import { z } from "zod";
import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

const MAX_BLOCKS = 200;
const MAX_BODY_CHARS = 4000;

export default defineTool({
  name: "get_topic_content",
  title: "Get topic content",
  description:
    "Read the full study-note content of one topic: its details and ordered content blocks (text, formula, code, media…).",
  inputSchema: {
    topic_id: z.string().uuid().describe("The topic to read. Use an id returned by list_topics."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (args, ctx) => {
    const db = supabaseForUser(ctx);

    const { data: topic, error } = await db
      .from("topics")
      .select("id,title,description,estimated_minutes,difficulty,published,completed,weak,bookmarked")
      .eq("id", args.topic_id)
      .maybeSingle();
    if (error) throw new ToolError(`Could not load the topic: ${error.message}`);
    if (!topic) throw new ToolError("Topic not found or not accessible with this account.");

    const { data: blocks, error: blockError } = await db
      .from("topic_blocks")
      .select("id,type,title,body,url,caption,position")
      .eq("topic_id", args.topic_id)
      .order("position")
      .limit(MAX_BLOCKS);
    if (blockError) throw new ToolError(`Could not load topic content: ${blockError.message}`);

    const blockJson = (b: {
      id: string;
      type: string;
      title: string | null;
      body: string;
      url: string | null;
      caption: string | null;
      position: number;
    }) => {
      const truncated = b.body.length > MAX_BODY_CHARS;
      return {
        id: b.id,
        type: b.type,
        title: b.title,
        body: truncated ? `${b.body.slice(0, MAX_BODY_CHARS)}…` : b.body,
        body_truncated: truncated,
        url: b.url,
        caption: b.caption,
        position: b.position,
      };
    };

    const content = (blocks ?? []).map(blockJson);
    const text = content
      .map((b) => `[${b.type}]${b.title ? ` ${b.title}` : ""}\n${b.body}${b.url ? `\n(link: ${b.url})` : ""}`)
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `# ${topic.title}\n\n${topic.description ?? ""}\n\n${text || "This topic has no content yet."}`,
        },
      ],
      structuredContent: {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          estimated_minutes: topic.estimated_minutes,
          difficulty: topic.difficulty,
          published: topic.published,
          completed: topic.completed,
          weak: topic.weak,
          bookmarked: topic.bookmarked,
        },
        blocks: content,
      },
    };
  },
});
