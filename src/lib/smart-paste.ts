/**
 * Smart Paste — heuristic parsing + category detection for pasted study material.
 * Pure client-safe logic. The AI server function reuses the same category registry.
 */

export type Category = {
  key: string;
  label: string;
  emoji: string;
  /** Existing topic content field this category maps to (jsonb key). */
  field: string;
  synonyms: string[];
};

/**
 * Canonical academic categories. `field` reuses the existing topic content keys
 * (see topic-schema.ts) so nothing new is needed in the database.
 */
export const CATEGORIES: Category[] = [
  {
    key: "definition",
    label: "Definition",
    emoji: "📖",
    field: "definition",
    synonyms: ["definition", "define", "what is", "meaning", "defined as"],
  },
  {
    key: "introduction",
    label: "Introduction",
    emoji: "🧭",
    field: "introduction",
    synonyms: ["introduction", "intro", "overview", "background"],
  },
  {
    key: "explanation",
    label: "Explanation",
    emoji: "💬",
    field: "explanation",
    synonyms: ["explanation", "description", "detail", "details", "elaboration"],
  },
  {
    key: "key_points",
    label: "Key Points",
    emoji: "🔑",
    field: "important_points",
    synonyms: [
      "key points",
      "important points",
      "highlights",
      "main points",
      "salient points",
      "remember",
    ],
  },
  {
    key: "features",
    label: "Features",
    emoji: "⭐",
    field: "features",
    synonyms: ["features", "characteristics", "properties", "attributes"],
  },
  {
    key: "types",
    label: "Types",
    emoji: "🗂",
    field: "types",
    synonyms: ["types", "kinds", "classification", "categories", "variants"],
  },
  {
    key: "components",
    label: "Components",
    emoji: "🧩",
    field: "components",
    synonyms: ["components", "elements", "parts", "modules"],
  },
  {
    key: "advantages",
    label: "Advantages",
    emoji: "✅",
    field: "advantages",
    synonyms: ["advantages", "benefits", "merits", "pros", "strengths", "positives"],
  },
  {
    key: "disadvantages",
    label: "Disadvantages",
    emoji: "❌",
    field: "disadvantages",
    synonyms: [
      "disadvantages",
      "limitations",
      "demerits",
      "cons",
      "drawbacks",
      "weaknesses",
      "challenges",
    ],
  },
  {
    key: "applications",
    label: "Applications",
    emoji: "💡",
    field: "applications",
    synonyms: ["applications", "uses", "use cases", "usage", "where used", "real life"],
  },
  {
    key: "examples",
    label: "Examples",
    emoji: "🧪",
    field: "examples",
    synonyms: ["examples", "example", "illustration", "sample", "for instance"],
  },
  {
    key: "importance",
    label: "Importance",
    emoji: "❗",
    field: "importance",
    synonyms: ["importance", "significance", "need", "why", "objectives", "goals", "purpose"],
  },
  {
    key: "principles",
    label: "Principles",
    emoji: "📐",
    field: "principles",
    synonyms: ["principles", "rules", "laws", "axioms"],
  },
  {
    key: "functions",
    label: "Functions",
    emoji: "⚙️",
    field: "functions",
    synonyms: ["functions", "roles", "responsibilities", "services"],
  },
  {
    key: "working",
    label: "Working",
    emoji: "🔧",
    field: "working",
    synonyms: ["working", "how it works", "operation", "mechanism"],
  },
  {
    key: "process",
    label: "Process / Steps",
    emoji: "🪜",
    field: "process",
    synonyms: ["process", "steps", "procedure", "methodology", "phases", "stages"],
  },
  {
    key: "algorithm",
    label: "Algorithm",
    emoji: "🧮",
    field: "algorithm",
    synonyms: ["algorithm", "pseudocode", "pseudo code"],
  },
  {
    key: "architecture",
    label: "Architecture",
    emoji: "🏛",
    field: "architecture",
    synonyms: ["architecture", "structure", "design", "layers"],
  },
  {
    key: "diagram",
    label: "Diagram",
    emoji: "🖼",
    field: "diagram",
    synonyms: ["diagram", "figure", "flowchart", "block diagram"],
  },
  {
    key: "comparison",
    label: "Difference / Comparison",
    emoji: "⚖️",
    field: "comparison",
    synonyms: ["difference", "differences", "comparison", "compare", "vs", "versus", "distinguish"],
  },
  {
    key: "formula",
    label: "Formula",
    emoji: "∑",
    field: "formula",
    synonyms: ["formula", "formulae", "equation", "equations"],
  },
  {
    key: "syntax",
    label: "Syntax",
    emoji: "⌨️",
    field: "syntax",
    synonyms: ["syntax", "code", "command", "query format"],
  },
  {
    key: "conclusion",
    label: "Conclusion",
    emoji: "🏁",
    field: "conclusion",
    synonyms: ["conclusion", "summary", "in summary", "to conclude", "recap"],
  },
  {
    key: "notes",
    label: "Notes",
    emoji: "📝",
    field: "personal_notes",
    synonyms: ["notes", "extra notes", "teacher notes", "remarks"],
  },
  {
    key: "references",
    label: "References",
    emoji: "🔗",
    field: "references",
    synonyms: ["references", "bibliography", "sources", "further reading"],
  },
  {
    key: "mcqs",
    label: "MCQs",
    emoji: "❓",
    field: "mcqs",
    synonyms: ["mcq", "mcqs", "multiple choice", "objective questions"],
  },
  {
    key: "previous_questions",
    label: "Previous Questions",
    emoji: "📜",
    field: "previous_questions",
    synonyms: ["previous questions", "past papers", "previously asked", "pyq"],
  },
  {
    key: "answer_2",
    label: "2 Marks Answer",
    emoji: "2️⃣",
    field: "answer_2",
    synonyms: ["2 marks", "two marks", "short answer"],
  },
  {
    key: "answer_5",
    label: "5 Marks Answer",
    emoji: "5️⃣",
    field: "answer_5",
    synonyms: ["5 marks", "five marks"],
  },
  {
    key: "answer_10",
    label: "10 Marks Answer",
    emoji: "🔟",
    field: "answer_10",
    synonyms: ["10 marks", "ten marks", "long answer", "essay"],
  },
  {
    key: "uncategorized",
    label: "Uncategorized",
    emoji: "⚠️",
    field: "uncategorized",
    synonyms: [],
  },
];

export const CATEGORY_BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryLabel(key: string) {
  return CATEGORY_BY_KEY.get(key)?.label ?? titleCase(key.replace(/_/g, " "));
}

export function categoryEmoji(key: string) {
  return CATEGORY_BY_KEY.get(key)?.emoji ?? "🗒";
}

/** Field (jsonb key) a section should be written to. */
export function categoryField(key: string) {
  return CATEGORY_BY_KEY.get(key)?.field ?? slug(key);
}

export function slug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "section"
  );
}

export function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export type ParsedSection = {
  id: string;
  category: string;
  title: string;
  content: string;
  confidence: number;
};

let counter = 0;
export function newSectionId() {
  counter += 1;
  return `sec_${Date.now().toString(36)}_${counter}`;
}

/** Normalize whitespace, bullets and numbering without changing meaning. */
export function cleanText(input: string): string {
  return (
    input
      .replace(/\r\n?/g, "\n")
      // pasted HTML artifacts
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      // invisible / exotic whitespace
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/[\u00a0\u2007\u202f\u2000-\u2006]/g, " ")
      .split("\n")
      .map((line) =>
        line
          .replace(/\t/g, " ")
          .replace(/ {2,}/g, " ")
          .replace(/^\s*(?:[•▪◦●·○▶►*+]|[-–—]{1,2})\s+/, "- ")
          .replace(/^\s*(\d+)\s*[).]\s+/, "$1. ")
          .replace(/^\s+/, "")
          .trimEnd(),
      )
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}


/** Remove duplicated consecutive lines and stray heading repeats. */
export function cleanFormatting(input: string): string {
  const lines = cleanText(input).split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (line.trim() && prev && prev.trim() === line.trim()) continue;
    if (!line.trim() && (!prev || !prev.trim())) continue;
    out.push(line);
  }
  return out.join("\n").trim();
}

function matchCategory(raw: string): { key: string; confidence: number } | null {
  const text = raw
    .toLowerCase()
    .replace(/^#{1,6}\s*/, "")
    .replace(/[:：.\-–—]+\s*$/, "")
    .replace(/^\d+[).\s]+/, "")
    .trim();
  if (!text) return null;

  let best: { key: string; confidence: number } | null = null;
  for (const cat of CATEGORIES) {
    for (const syn of cat.synonyms) {
      if (text === syn) return { key: cat.key, confidence: 0.98 };
      // "Advantages of DBMS", "Types of keys", "DBMS advantages"
      const re = new RegExp(`(^|\\b)${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`, "i");
      if (re.test(text) && text.length <= 80) {
        const score = 0.9 - Math.min(0.2, text.length / 400);
        if (!best || score > best.confidence) best = { key: cat.key, confidence: score };
      }
    }
  }
  return best;
}

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^#{1,6}\s+\S/.test(t)) return true;
  if (t.length > 80) return false;
  if (/^[-•*]\s/.test(t)) return false;
  if (/^\d+\.\s+\S/.test(t) && t.length > 40) return false;
  if (/:\s*$/.test(t)) return true;
  if (t === t.toUpperCase() && /[A-Z]{3}/.test(t) && !/[.!?]$/.test(t)) return true;
  if (/^\*\*[^*]+\*\*:?$/.test(t)) return true;
  if (matchCategory(t) && !/[.!?]$/.test(t) && t.split(/\s+/).length <= 8) return true;
  return false;
}

function stripHeadingSyntax(line: string) {
  return line
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/[:：]\s*$/, "")
    .trim();
}

/** Classify a body of text with no heading, using lightweight semantic cues. */
function classifyBody(body: string): { key: string; confidence: number } {
  const t = body.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (
    /\b(is|are)\s+(a|an|the)\b.*\b(process|method|technique|system|concept|term|way)\b/.test(t) ||
    has("is defined as", "refers to", "can be defined", "is known as")
  )
    return { key: "definition", confidence: 0.72 };
  if (
    has("advantage", "benefit", "improves", "reduces redundancy", "helps in", "easier to", "merit")
  )
    return { key: "advantages", confidence: 0.6 };
  if (
    has(
      "disadvantage",
      "limitation",
      "drawback",
      "however",
      "may require",
      "increases complexity",
      "difficult to",
    )
  )
    return { key: "disadvantages", confidence: 0.6 };
  if (has("for example", "e.g.", "such as ", "consider the"))
    return { key: "examples", confidence: 0.55 };
  if (has("is used in", "used for", "application", "widely used"))
    return { key: "applications", confidence: 0.58 };
  if (/^\s*(step\s*1|1\.)/i.test(body) && has("then", "next", "finally", "step"))
    return { key: "process", confidence: 0.55 };
  if (has("in conclusion", "to summarize", "overall,"))
    return { key: "conclusion", confidence: 0.6 };
  return { key: "uncategorized", confidence: 0.25 };
}

/**
 * Local (no-AI) parser. Preserves existing headings when present,
 * otherwise splits paragraphs and classifies them semantically.
 */
export function parseSmartPaste(raw: string): ParsedSection[] {
  const text = cleanText(raw);
  if (!text) return [];

  const lines = text.split("\n");
  type Block = { title: string | null; lines: string[] };
  const blocks: Block[] = [];
  let current: Block = { title: null, lines: [] };

  for (const line of lines) {
    if (isHeadingLine(line)) {
      if (current.title || current.lines.some((l) => l.trim())) blocks.push(current);
      current = { title: stripHeadingSyntax(line), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.title || current.lines.some((l) => l.trim())) blocks.push(current);

  const sections: ParsedSection[] = [];

  for (const block of blocks) {
    const body = cleanFormatting(block.lines.join("\n"));
    if (block.title) {
      if (!body) continue;
      const matched = matchCategory(block.title);
      sections.push({
        id: newSectionId(),
        category: matched?.key ?? "uncategorized",
        title: matched ? categoryLabel(matched.key) : titleCase(block.title),
        content: body,
        confidence: matched?.confidence ?? 0.4,
      });
    } else {
      // No heading — split into paragraphs and classify each.
      for (const para of body.split(/\n{2,}/)) {
        const chunk = para.trim();
        if (!chunk) continue;
        const guess = classifyBody(chunk);
        sections.push({
          id: newSectionId(),
          category: guess.key,
          title: categoryLabel(guess.key),
          content: chunk,
          confidence: guess.confidence,
        });
      }
    }
  }

  return mergeSameCategory(sections);
}

export function mergeSameCategory(sections: ParsedSection[]): ParsedSection[] {
  const out: ParsedSection[] = [];
  for (const s of sections) {
    const existing =
      s.category !== "uncategorized"
        ? out.find((o) => o.category === s.category && o.title === s.title)
        : undefined;
    if (existing) {
      existing.content = `${existing.content}\n${s.content}`.trim();
      existing.confidence = Math.min(existing.confidence, s.confidence);
    } else {
      out.push({ ...s });
    }
  }
  return out;
}

export function confidenceLabel(c: number) {
  if (c >= 0.8) return "High confidence";
  if (c >= 0.5) return "Medium confidence";
  return "Low confidence";
}

/** Merge organized sections into the existing topic content jsonb. */
export function applySections(
  existing: Record<string, string>,
  sections: ParsedSection[],
  mode: "replace" | "append",
): Record<string, string> {
  const next: Record<string, string> = mode === "replace" ? { ...existing } : { ...existing };
  for (const s of sections) {
    const field = s.category === "uncategorized" ? slug(s.title) : categoryField(s.category);
    const body = s.content.trim();
    if (!body) continue;
    if (mode === "append" && next[field]?.trim()) {
      next[field] = `${next[field]!.trim()}\n\n${body}`;
    } else {
      next[field] = body;
    }
  }
  return next;
}

/** Parse a pasted list of topic names ("1. Intro", "- Keys", "Keys"). */
export function parseTopicList(raw: string): string[] {
  return raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) =>
      l
        .replace(/^\s*(\d+)\s*[).:.-]\s*/, "")
        .replace(/^\s*[-•*]\s*/, "")
        .replace(/^\s*#+\s*/, "")
        .trim(),
    )
    .filter((l) => l.length > 0)
    .slice(0, 200);
}

/** Parse a pasted list of units ("Unit 1 - Introduction"). */
export function parseUnitList(raw: string): { name: string }[] {
  return parseTopicList(raw).map((line) => {
    const m = line.match(/^unit\s*(\d+)\s*[-–—:.]?\s*(.*)$/i);
    if (m) {
      const title = (m[2] ?? "").trim();
      return { name: title ? `Unit ${m[1]} — ${title}` : `Unit ${m[1]}` };
    }
    return { name: line };
  });
}

/** Standard academic topic template — creates empty sections to fill in. */
export const STANDARD_TEMPLATE_KEYS = [
  "definition",
  "introduction",
  "key_points",
  "features",
  "types",
  "advantages",
  "disadvantages",
  "applications",
  "examples",
  "conclusion",
];

export function standardTemplateContent(): Record<string, string> {
  const content: Record<string, string> = {};
  for (const key of STANDARD_TEMPLATE_KEYS) content[categoryField(key)] = "";
  return content;
}

/**
 * Parse a pasted syllabus into units with their topics.
 * Recognises "Unit 1: Name" / "Module 2 — Name" / "UNIT I" headings, and treats
 * every following bullet, numbered or indented line as a topic of that unit.
 */
export function parseSyllabus(raw: string): { name: string; topics: string[] }[] {
  const units: { name: string; topics: string[] }[] = [];
  const unitHead = /^\s*(unit|module|chapter|part)\b[\s:.\-—]*([ivxlcdm\d]+)?[\s:.\-—]*(.*)$/i;
  let current: { name: string; topics: string[] } | null = null;

  for (const line of raw.split(/\r?\n/)) {
    const text = line.trim();
    if (!text) continue;
    const head = unitHead.exec(text);
    if (head) {
      const label = `${titleCase(head[1] ?? "Unit")} ${head[2] ?? units.length + 1}`.trim();
      const rest = (head[3] ?? "").replace(/^[:.\-—\s]+/, "").trim();
      current = { name: rest ? `${label} — ${rest}` : label, topics: [] };
      units.push(current);
      continue;
    }
    const topic = text.replace(/^\s*(?:[-*•>]|\d+[.)]|[a-z][.)])\s*/i, "").trim();
    if (!topic) continue;
    if (!current) {
      current = { name: `Unit ${units.length + 1}`, topics: [] };
      units.push(current);
    }
    current.topics.push(topic.slice(0, 160));
  }

  return units.filter((u) => u.name || u.topics.length);
}

/* ------------------------------------------------------------------ *
 * Phase 2 — structure detection: sections -> topic_blocks drafts
 * ------------------------------------------------------------------ */

/** Kinds supported by the existing topic_blocks model (see lib/blocks.ts). */
export type PasteBlockKind =
  | "text"
  | "heading"
  | "list"
  | "table"
  | "code"
  | "formula"
  | "note"
  | "important"
  | "question"
  | "divider";

export type BlockDraft = { type: PasteBlockKind; title: string; body: string };

/** Category -> best matching existing block kind. */
const CATEGORY_BLOCK: Record<string, PasteBlockKind> = {
  key_points: "important",
  importance: "important",
  notes: "note",
  formula: "formula",
  syntax: "code",
  algorithm: "code",
  mcqs: "question",
  previous_questions: "question",
  answer_2: "question",
  answer_5: "question",
  answer_10: "question",
  comparison: "table",
};

const WARNING_RE = /\b(warning|caution|careful|do not|don't|avoid|pitfall)\b/i;
const IMPORTANT_RE = /\b(important|must remember|note that this is important|key point|exam tip)\b/i;
const NOTE_RE = /\b(note|remark|tip|hint)\b/i;
const QUESTION_RE = /\b(question|q\d|mcq|viva|exam answer|answer)\b/i;
const FORMULA_RE = /\b(formula|equation)\b/i;
const CODE_RE = /\b(code|syntax|program|query|pseudocode)\b/i;

function isListLine(line: string) {
  return /^\s*(?:-\s+|\d+\.\s+)/.test(line);
}

function isTableLine(line: string) {
  return line.trim().startsWith("|") && line.includes("|", 1);
}

/** Detect the block kind for a chunk of already-cleaned text. */
export function detectBlockKind(title: string, body: string): PasteBlockKind {
  const lines = body.split("\n").filter((l) => l.trim());
  if (!lines.length) return "text";
  if (lines.every(isTableLine) && lines.length >= 2) return "table";
  if (/^```/.test(body.trim())) return "code";

  const label = title.toLowerCase();
  if (FORMULA_RE.test(label)) return "formula";
  if (CODE_RE.test(label)) return "code";
  if (QUESTION_RE.test(label)) return "question";
  if (WARNING_RE.test(label) || IMPORTANT_RE.test(label)) return "important";
  if (NOTE_RE.test(label)) return "note";

  if (lines.filter(isListLine).length >= Math.max(2, Math.ceil(lines.length * 0.6))) return "list";
  if (WARNING_RE.test(lines[0] ?? "") && body.length < 400) return "important";
  if (/^\s*(note|tip)\s*[:\-]/i.test(body)) return "note";
  if (/\?\s*$/m.test(body) && lines.length <= 6 && QUESTION_RE.test(body)) return "question";
  return "text";
}

/** Block kind for a detected academic category. */
export function categoryBlockKind(category: string, title: string, body: string): PasteBlockKind {
  const mapped = CATEGORY_BLOCK[category];
  const detected = detectBlockKind(title, body);
  if (detected === "table" || detected === "code" || detected === "formula") return detected;
  if (mapped) return mapped === "table" ? "text" : mapped;
  return detected;
}

/**
 * Split one parsed section into one or more blocks so that lists, tables and
 * code inside a section become their own blocks instead of one dense paragraph.
 */
export function sectionToBlockDrafts(section: {
  category: string;
  title: string;
  content: string;
}): BlockDraft[] {
  const body = cleanFormatting(section.content);
  if (!body.trim()) return [];

  const forced = CATEGORY_BLOCK[section.category];
  if (forced === "note" || forced === "important" || forced === "question")
    return [{ type: forced, title: section.title, body }];

  const kinds: BlockDraft[] = [];
  let buffer: string[] = [];
  let bufferKind: PasteBlockKind | null = null;

  const flush = () => {
    const text = buffer.join("\n").trim();
    buffer = [];
    if (!text || !bufferKind) return;
    kinds.push({ type: bufferKind, title: "", body: text });
    bufferKind = null;
  };

  for (const line of body.split("\n")) {
    const kind: PasteBlockKind | null = !line.trim()
      ? null
      : isTableLine(line)
        ? "table"
        : isListLine(line)
          ? "list"
          : "text";
    if (kind === null) {
      if (bufferKind === "text") flush();
      else if (buffer.length) buffer.push("");
      continue;
    }
    if (bufferKind && kind !== bufferKind) flush();
    bufferKind = kind;
    buffer.push(line);
  }
  flush();

  if (!kinds.length) return [{ type: "text", title: section.title, body }];

  // Refine the first block's kind using the section title, and carry the title.
  const first = kinds[0] as BlockDraft;
  const refined = categoryBlockKind(section.category, section.title, first.body);
  if (kinds.length === 1) return [{ type: refined, title: section.title, body: first.body }];
  first.title = section.title;
  if (refined === "formula" || refined === "code") first.type = refined;
  return kinds;
}

/** Convert a full set of parsed sections into topic_blocks drafts. */
export function sectionsToBlockDrafts(
  sections: { category: string; title: string; content: string }[],
): BlockDraft[] {
  return sections.flatMap(sectionToBlockDrafts);
}
