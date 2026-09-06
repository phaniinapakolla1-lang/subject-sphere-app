/**
 * Syllabus paste-and-parse.
 * Turns pasted syllabus text into a Course → Subject → Unit → Topic preview tree.
 * Nothing is written to the database here — the admin reviews the preview first.
 */

export type ParsedTopic = { title: string };
export type ParsedUnit = { name: string; topics: ParsedTopic[] };
export type ParsedSubject = { name: string; units: ParsedUnit[] };
export type ParsedSyllabus = { course: string; subjects: ParsedSubject[] };

const COURSE_RE = /^(?:course|programme|program)\s*[:\-–]\s*(.+)$/i;
const SUBJECT_RE = /^(?:subject|paper)\s*\d*\s*[:\-–]?\s*(.*)$/i;
const UNIT_RE = /^(?:unit|module|chapter)\s*[-–]?\s*([ivxlcdm\d]+)?\s*[:\-–.]?\s*(.*)$/i;

const BULLET = /^\s*(?:[-*•·▪◦]|\d{1,3}[.)]|\([a-z0-9]{1,3}\)|[a-z][.)])\s+/i;

function clean(line: string) {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripBullet(line: string) {
  return clean(line.replace(BULLET, ""));
}

/** Split a "a, b, c" topic line into separate topics when it clearly is a list. */
function splitInline(text: string): string[] {
  if (text.length < 40) return [text];
  const parts = text
    .split(/\s*[;]\s*/)
    .map(clean)
    .filter(Boolean);
  return parts.length > 1 ? parts : [text];
}

export function parseSyllabus(raw: string): ParsedSyllabus {
  const lines = raw.split(/\r?\n/).map(clean);

  const result: ParsedSyllabus = { course: "", subjects: [] };
  let subject: ParsedSubject | null = null;
  let unit: ParsedUnit | null = null;

  const ensureSubject = () => {
    if (!subject) {
      subject = { name: "General", units: [] };
      result.subjects.push(subject);
    }
    return subject;
  };
  const ensureUnit = () => {
    const s = ensureSubject();
    if (!unit) {
      unit = { name: `Unit ${s.units.length + 1}`, topics: [] };
      s.units.push(unit);
    }
    return unit;
  };

  for (const line of lines) {
    if (!line) continue;

    const courseMatch = line.match(COURSE_RE);
    if (courseMatch?.[1]) {
      result.course = clean(courseMatch[1]);
      continue;
    }

    if (/^(?:subject|paper)\b/i.test(line)) {
      const m = line.match(SUBJECT_RE);
      const name = clean(m?.[1] ?? "");
      if (name) {
        subject = { name, units: [] };
        result.subjects.push(subject);
        unit = null;
        continue;
      }
    }

    if (/^(?:unit|module|chapter)\b/i.test(line)) {
      const m = line.match(UNIT_RE);
      const num = m?.[1] ? clean(m[1]) : "";
      const title = clean(m?.[2] ?? "");
      const label = title
        ? num
          ? `Unit ${num}: ${title}`
          : title
        : num
          ? `Unit ${num}`
          : line;
      const s = ensureSubject();
      unit = { name: label, topics: [] };
      s.units.push(unit);
      continue;
    }

    // Anything else is a topic line.
    const text = stripBullet(line);
    if (!text) continue;
    const u = ensureUnit();
    for (const t of splitInline(text)) {
      if (t) u.topics.push({ title: t });
    }
  }

  // Drop empty scaffolding
  result.subjects = result.subjects
    .map((s) => ({ ...s, units: s.units.filter((u) => u.topics.length > 0) }))
    .filter((s) => s.units.length > 0);

  if (!result.course) result.course = "Untitled course";
  return result;
}

export function syllabusCounts(tree: ParsedSyllabus) {
  const subjects = tree.subjects.length;
  const units = tree.subjects.reduce((n, s) => n + s.units.length, 0);
  const topics = tree.subjects.reduce(
    (n, s) => n + s.units.reduce((m, u) => m + u.topics.length, 0),
    0,
  );
  return { subjects, units, topics };
}

export const SYLLABUS_SAMPLE = `COURSE: MBA 1st Semester

SUBJECT 1: Marketing Management

UNIT 1: Introduction to Marketing
1. Meaning of Marketing
2. Marketing Concepts
3. Functions of Marketing

UNIT 2: Consumer Behaviour
1. Consumer Behaviour
2. Buying Process
3. Factors influencing buying behaviour`;
