import type { Row } from "@/lib/data";

export type TopicBlock = Row<"topic_blocks">;

export type BlockKind =
  | "text"
  | "heading"
  | "list"
  | "table"
  | "code"
  | "formula"
  | "image"
  | "video"
  | "link"
  | "file"
  | "note"
  | "important"
  | "question"
  | "divider";

export type BlockDef = {
  kind: BlockKind;
  label: string;
  emoji: string;
  hint: string;
  /** Block carries a body textarea */
  body: boolean;
  /** Block carries a url / media reference */
  media?: "image" | "video" | "link" | "file";
  rows?: number;
  mono?: boolean;
};

export const BLOCK_TYPES: BlockDef[] = [
  {
    kind: "text",
    label: "Text",
    emoji: "📝",
    hint: "Paragraphs, explanation, notes",
    body: true,
    rows: 6,
  },
  { kind: "heading", label: "Heading", emoji: "🔠", hint: "Section title", body: false },
  {
    kind: "list",
    label: "List",
    emoji: "•",
    hint: "Bullet or numbered points",
    body: true,
    rows: 6,
  },
  {
    kind: "table",
    label: "Table",
    emoji: "▦",
    hint: "Markdown table",
    body: true,
    rows: 6,
    mono: true,
  },
  {
    kind: "code",
    label: "Code",
    emoji: "💻",
    hint: "Code snippet",
    body: true,
    rows: 8,
    mono: true,
  },
  {
    kind: "formula",
    label: "Formula",
    emoji: "∑",
    hint: "Equation or derivation",
    body: true,
    rows: 4,
    mono: true,
  },
  {
    kind: "image",
    label: "Image",
    emoji: "🖼️",
    hint: "Diagram, screenshot, scan",
    body: false,
    media: "image",
  },
  {
    kind: "video",
    label: "Video",
    emoji: "🎬",
    hint: "YouTube or video link",
    body: false,
    media: "video",
  },
  {
    kind: "link",
    label: "Link",
    emoji: "🔗",
    hint: "External reference",
    body: false,
    media: "link",
  },
  {
    kind: "file",
    label: "File",
    emoji: "📎",
    hint: "PDF or attachment",
    body: false,
    media: "file",
  },
  {
    kind: "note",
    label: "Note",
    emoji: "💡",
    hint: "Side note / tip callout",
    body: true,
    rows: 4,
  },
  {
    kind: "important",
    label: "Important",
    emoji: "⭐",
    hint: "Must-remember point",
    body: true,
    rows: 4,
  },
  { kind: "question", label: "Question", emoji: "❓", hint: "Q&A, MCQ, viva", body: true, rows: 6 },
  { kind: "divider", label: "Divider", emoji: "―", hint: "Visual separator", body: false },
];

export const BLOCK_BY_KIND = new Map(BLOCK_TYPES.map((b) => [b.kind, b]));

export function blockDef(kind: string): BlockDef {
  return BLOCK_BY_KIND.get(kind as BlockKind) ?? (BLOCK_TYPES[0] as BlockDef);
}

/** Blocks used by the Standard Academic template. */
export const STANDARD_BLOCKS: { type: BlockKind; title: string; body: string }[] = [
  { type: "text", title: "Definition", body: "" },
  { type: "text", title: "Explanation", body: "" },
  { type: "list", title: "Key Points", body: "- " },
  { type: "list", title: "Advantages", body: "- " },
  { type: "list", title: "Disadvantages", body: "- " },
  { type: "text", title: "Examples", body: "" },
  { type: "question", title: "Exam Questions", body: "" },
];

/** Convert legacy JSONB topic content into draft blocks. */
export function legacyToBlocks(
  content: Record<string, unknown> | null | undefined,
  labelFor: (key: string) => string,
): { type: BlockKind; title: string; body: string }[] {
  if (!content) return [];
  const out: { type: BlockKind; title: string; body: string }[] = [];
  for (const [key, value] of Object.entries(content)) {
    const body = typeof value === "string" ? value.trim() : "";
    if (!body) continue;
    const type: BlockKind = /^-|\n-/.test(body) ? "list" : "text";
    out.push({ type, title: labelFor(key), body });
  }
  return out;
}
