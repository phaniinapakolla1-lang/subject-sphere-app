/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Demo mode — a fully in-memory sample workspace.
 * Nothing here ever touches the database: the data lives in this module for the
 * length of the browser session and is thrown away on reload/exit.
 */

const FLAG = "studyos:demo";

export const DEMO_USER = {
  id: "00000000-0000-4000-8000-0000000d3m0",
  email: "demo@studyos.app",
  user_metadata: { full_name: "Demo Student" },
} as const;

export function isDemo(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}

export function startDemo() {
  try {
    window.localStorage.setItem(FLAG, "1");
  } catch {
    /* ignore */
  }
  resetDemoData();
}

export function stopDemo() {
  try {
    window.localStorage.removeItem(FLAG);
  } catch {
    /* ignore */
  }
  store = null;
}

const uid = (p: string, n: number) => `${p}-${String(n).padStart(4, "0")}`;
const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};
const day = (offsetDays: number) => iso(offsetDays).slice(0, 10);

type Store = Record<string, any[]>;
let store: Store | null = null;

const SUBJECT_SEED = [
  {
    name: "Computer Networks",
    code: "CS304",
    color: "#7c5cff",
    icon: "Network",
    units: [
      ["Introduction to Networks", ["OSI Model", "TCP/IP Model", "Network Topologies"]],
      ["Data Link Layer", ["Error Detection", "Flow Control", "MAC Protocols"]],
      ["Network Layer", ["IP Addressing", "Subnetting", "Routing Algorithms"]],
    ],
  },
  {
    name: "Database Management Systems",
    code: "CS302",
    color: "#22d3ee",
    icon: "Database",
    units: [
      ["Relational Model", ["Keys and Constraints", "Relational Algebra"]],
      ["SQL", ["Joins", "Aggregate Functions", "Subqueries"]],
      ["Normalization", ["1NF to 3NF", "BCNF", "Functional Dependency"]],
    ],
  },
  {
    name: "Operating Systems",
    code: "CS303",
    color: "#f59e0b",
    icon: "Cpu",
    units: [
      ["Processes", ["Process States", "Context Switching"]],
      ["CPU Scheduling", ["Round Robin", "SJF and Priority"]],
      ["Memory Management", ["Paging", "Segmentation", "Virtual Memory"]],
    ],
  },
  {
    name: "Data Structures & Algorithms",
    code: "CS201",
    color: "#34d399",
    icon: "Binary",
    units: [
      ["Linear Structures", ["Arrays and Strings", "Linked Lists", "Stacks & Queues"]],
      ["Trees & Graphs", ["Binary Search Tree", "Graph Traversal"]],
    ],
  },
  {
    name: "Software Engineering",
    code: "CS305",
    color: "#f472b6",
    icon: "Boxes",
    units: [
      ["Process Models", ["Waterfall vs Agile", "Scrum Framework"]],
      ["Design & Testing", ["UML Diagrams", "Unit vs Integration Testing"]],
    ],
  },
];

function sampleContent(title: string) {
  return {
    definition: `**${title}** — a concise, exam-ready definition written the way you would want to recall it under pressure.`,
    introduction: `This sample topic shows how StudyOS stores structured knowledge for *${title}*. In your own workspace every section below is editable and autosaves as you type.`,
    working: `1. Understand the core idea behind ${title}.\n2. Walk through a worked example.\n3. Connect it to the previous topic in this unit.`,
    important_points: `- High-yield: appears in most previous year papers\n- Commonly confused with the neighbouring topic\n- Draw the diagram to earn full marks`,
    answer_2: `${title} in two lines — the short-answer version for 2 mark questions.`,
    answer_5: `A structured five-mark answer for ${title}: definition, working, one example, and a closing line.`,
    mcqs: `1. Which statement about ${title} is correct?\n   a) Option A  b) Option B  c) Option C\n   Ans: b`,
  };
}

function build(): Store {
  const u = DEMO_USER.id;
  const subjects: any[] = [];
  const units: any[] = [];
  const topics: any[] = [];
  const topic_blocks: any[] = [];
  let si = 0;
  let ui = 0;
  let ti = 0;

  for (const s of SUBJECT_SEED) {
    const sid = uid("sub", ++si);
    subjects.push({
      id: sid,
      user_id: u,
      name: s.name,
      code: s.code,
      description: `Sample ${s.name} workspace with units, topics and revision data.`,
      color: s.color,
      icon: s.icon,
      semester: 5,
      credits: 4,
      estimated_hours: 40,
      favorite: si <= 2,
      archived: false,
      position: si,
      slug: s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: "Computer Science",
      level: "intermediate",
      thumbnail_url: null,
      duration: "8 weeks",
      academic_year: "2025-26",
      status: "published",
      visibility: "students",
      is_course: true,
      learning_outcomes: [],
      published_at: iso(-40),
      created_at: iso(-60),
      updated_at: iso(-2),
    });
    s.units.forEach(([unitName, topicNames], unitIdx) => {
      const unitId = uid("unit", ++ui);
      units.push({
        id: unitId,
        user_id: u,
        subject_id: sid,
        name: unitName as string,
        description: `Unit ${unitIdx + 1} of ${s.name}`,
        estimated_hours: 8,
        priority: unitIdx === 0 ? "high" : "medium",
        position: unitIdx,
        created_at: iso(-58),
        updated_at: iso(-3),
      });
      (topicNames as string[]).forEach((title, topicIdx) => {
        const done = (ti + topicIdx) % 3 === 0;
        topics.push({
          id: uid("top", ++ti),
          user_id: u,
          unit_id: unitId,
          subject_id: sid,
          title,
          content: sampleContent(title),
          priority: topicIdx === 0 ? "high" : "medium",
          difficulty: topicIdx % 2 ? "hard" : "medium",
          estimated_minutes: 45,
          previous_question: topicIdx % 2 === 0,
          favorite: topicIdx === 0,
          bookmarked: topicIdx === 1,
          weak: topicIdx === 2,
          completed: done,
          revision_count: done ? 2 : 0,
          last_revised_at: done ? iso(-5) : null,
          next_revision_at: done ? iso(-1) : iso(topicIdx),
          position: topicIdx,
          created_at: iso(-50),
          updated_at: iso(-1),
        });
        const tid = uid("top", ti);
        Object.entries(sampleContent(title)).forEach(([key, value], bi) => {
          topic_blocks.push({
            id: `${tid}-blk-${bi}`,
            user_id: u,
            topic_id: tid,
            subject_id: sid,
            type: /^-|\n-/.test(value as string) ? "list" : "text",
            title: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            body: value as string,
            caption: null,
            url: null,
            storage_path: null,
            meta: {},
            position: bi,
            created_at: iso(-50),
            updated_at: iso(-1),
          });
        });
      });
    });
  }

  const notes = [
    ["Subnetting cheat sheet", "/24 = 256 addresses, /25 = 128 … halve each time.\n\n- Network address: first\n- Broadcast: last\n- Usable = total - 2", ["networks", "cheatsheet"], true],
    ["Normalization in one page", "1NF: atomic values\n2NF: no partial dependency\n3NF: no transitive dependency\nBCNF: every determinant is a candidate key", ["dbms"], true],
    ["Scheduling formulas", "Turnaround = Completion - Arrival\nWaiting = Turnaround - Burst", ["os"], false],
    ["Exam week plan", "Mon: CN Unit 1-2\nTue: DBMS SQL\nWed: OS Memory\nThu: Mock paper", ["planning"], false],
  ].map(([title, body, tags, pinned], i) => ({
    id: uid("note", i + 1),
    user_id: u,
    subject_id: subjects[i % subjects.length]!.id,
    title,
    body,
    tags,
    pinned,
    bookmarked: i === 1,
    created_at: iso(-10 + i),
    updated_at: iso(-i),
  }));

  const cardSeed = [
    ["Which OSI layer performs routing?", "The Network layer (Layer 3)."],
    ["What does ARP resolve?", "An IP address into a MAC address."],
    ["Define a candidate key.", "A minimal set of attributes that uniquely identifies a tuple."],
    ["What is thrashing?", "Excessive paging where the CPU spends more time swapping than executing."],
    ["Time complexity of BST search (balanced)?", "O(log n)."],
    ["What is a sprint in Scrum?", "A fixed-length iteration (1-4 weeks) producing a potentially shippable increment."],
    ["Purpose of the three-way handshake?", "To establish a reliable TCP connection: SYN, SYN-ACK, ACK."],
    ["What is denormalization used for?", "Improving read performance by accepting controlled redundancy."],
  ];
  const flashcards = cardSeed.map(([q, a], i) => ({
    id: uid("card", i + 1),
    user_id: u,
    subject_id: subjects[i % subjects.length]!.id,
    topic_id: null,
    question: q,
    answer: a,
    tags: [],
    difficulty: i % 3 === 0 ? "hard" : "medium",
    box: (i % 4) + 1,
    reviews: i,
    last_reviewed_at: i ? iso(-i) : null,
    due_at: iso(i % 3 === 0 ? -1 : i),
    created_at: iso(-20),
    updated_at: iso(-1),
  }));

  const assignments = [
    ["Socket programming lab record", "todo", "high", 3, 0],
    ["ER diagram for library system", "in_progress", "medium", 6, 45],
    ["Scheduling algorithms simulation", "submitted", "medium", -2, 100],
    ["Case study: Agile vs Waterfall", "graded", "low", -8, 100],
  ].map(([title, status, priority, due, progress], i) => ({
    id: uid("asg", i + 1),
    user_id: u,
    subject_id: subjects[i % subjects.length]!.id,
    title,
    notes: "Sample assignment created for the demo workspace.",
    due_at: iso(due as number),
    priority,
    status,
    progress,
    created_at: iso(-15),
    updated_at: iso(-1),
  }));

  const exams = [
    ["Computer Networks — Mid Sem", 6, "Hall A", 55],
    ["DBMS — Mid Sem", 11, "Hall B", 40],
    ["Operating Systems — Unit Test", 18, "Lab 2", 25],
  ].map(([name, inDays, venue, prep], i) => ({
    id: uid("exam", i + 1),
    user_id: u,
    subject_id: subjects[i]!.id,
    name,
    exam_date: day(inDays as number),
    exam_time: "10:00:00",
    venue,
    hall_ticket: `HT-2026-00${i + 1}`,
    syllabus: "Units 1 to 3, including previous year questions.",
    preparation: prep,
    created_at: iso(-12),
    updated_at: iso(-1),
  }));

  const papers = [
    ["CN End Sem 2024", "question", 2024],
    ["DBMS Model Paper", "model", 2025],
    ["OS End Sem 2023 with solutions", "solution", 2023],
  ].map(([title, category, year], i) => ({
    id: uid("paper", i + 1),
    user_id: u,
    subject_id: subjects[i]!.id,
    title,
    category,
    year,
    semester: 5,
    content: "Sample paper entry — upload your own once you have an account.",
    url: null,
    storage_path: null,
    created_at: iso(-30),
    updated_at: iso(-5),
  }));

  const study_sessions: any[] = [];
  for (let d = 27; d >= 0; d--) {
    if (d % 7 === 6) continue;
    const count = 1 + (d % 2);
    for (let k = 0; k < count; k++) {
      study_sessions.push({
        id: uid("ses", study_sessions.length + 1),
        user_id: u,
        subject_id: subjects[(d + k) % subjects.length]!.id,
        topic_id: null,
        mode: k % 2 ? "stopwatch" : "pomodoro",
        minutes: 25 + ((d * 7 + k * 13) % 40),
        started_at: iso(-d),
        created_at: iso(-d),
      });
    }
  }

  return {
    profiles: [
      {
        id: u,
        display_name: "Demo Student",
        email: DEMO_USER.email,
        avatar_url: null,
        theme: "dark",
        accent: "violet",
        font_size: "md",
        daily_goal_minutes: 120,
        student_id: "DEMO-0001",
        course: "B.Tech Computer Science",
        semester_label: "Semester 5",
        section: "A",
        academic_year: "2025-26",
        status: "active",
        last_login_at: iso(0),
        created_at: iso(-60),
        updated_at: iso(0),
      },
    ],
    subjects,
    units,
    topics,
    topic_blocks,
    course_access: [],
    course_progress: [],
    notes,
    flashcards,
    assignments,
    exams,
    papers,
    resources: [],
    study_sessions,
    user_roles: [{ id: "role-demo", user_id: u, role: "student", created_at: iso(-60) }],
  };
}

export function demoStore(): Store {
  if (!store) store = build();
  return store;
}

export function resetDemoData() {
  store = build();
}

export function demoRows(table: string): any[] {
  return demoStore()[table] ?? (demoStore()[table] = []);
}

/** Minimal chainable stand-in for the PostgREST query builder. */
type Op = { kind: string; args: any[] };

export class DemoQuery<T = any> implements PromiseLike<{ data: T; error: null }> {
  private ops: Op[] = [];
  constructor(private table: string) {}

  private push(kind: string, ...args: any[]) {
    this.ops.push({ kind, args });
    return this;
  }

  select(..._a: any[]) {
    return this.push("select");
  }
  eq(col: string, v: any) {
    return this.push("eq", col, v);
  }
  neq(col: string, v: any) {
    return this.push("neq", col, v);
  }
  is(col: string, v: any) {
    return this.push("eq", col, v);
  }
  in(col: string, v: any[]) {
    return this.push("in", col, v);
  }
  gte(col: string, v: any) {
    return this.push("gte", col, v);
  }
  lte(col: string, v: any) {
    return this.push("lte", col, v);
  }
  gt(col: string, v: any) {
    return this.push("gt", col, v);
  }
  lt(col: string, v: any) {
    return this.push("lt", col, v);
  }
  ilike(col: string, v: string) {
    return this.push("ilike", col, v);
  }
  or(expr: string) {
    return this.push("or", expr);
  }
  contains(col: string, v: any) {
    return this.push("contains", col, v);
  }
  order(col: string, opts?: { ascending?: boolean }) {
    return this.push("order", col, opts?.ascending !== false);
  }
  limit(n: number) {
    return this.push("limit", n);
  }
  range(from: number, to: number) {
    return this.push("range", from, to);
  }

  private rows(): any[] {
    let rows = [...demoRows(this.table)];
    for (const op of this.ops) {
      const [a, b] = op.args;
      switch (op.kind) {
        case "eq":
          rows = rows.filter((r) => r[a] === b);
          break;
        case "neq":
          rows = rows.filter((r) => r[a] !== b);
          break;
        case "in":
          rows = rows.filter((r) => (b as any[]).includes(r[a]));
          break;
        case "gte":
          rows = rows.filter((r) => r[a] != null && r[a] >= b);
          break;
        case "lte":
          rows = rows.filter((r) => r[a] != null && r[a] <= b);
          break;
        case "gt":
          rows = rows.filter((r) => r[a] != null && r[a] > b);
          break;
        case "lt":
          rows = rows.filter((r) => r[a] != null && r[a] < b);
          break;
        case "ilike": {
          const needle = String(b).replaceAll("%", "").toLowerCase();
          rows = rows.filter((r) => String(r[a] ?? "").toLowerCase().includes(needle));
          break;
        }
        case "contains":
          rows = rows.filter((r) =>
            Array.isArray(r[a]) ? (b as any[]).every((x) => r[a].includes(x)) : false,
          );
          break;
        case "order":
          rows.sort((x, y) => {
            const av = x[a] ?? "";
            const bv = y[a] ?? "";
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return b ? cmp : -cmp;
          });
          break;
        case "limit":
          rows = rows.slice(0, a);
          break;
        case "range":
          rows = rows.slice(a, b + 1);
          break;
        default:
          break;
      }
    }
    return rows;
  }

  maybeSingle() {
    return Promise.resolve({ data: this.rows()[0] ?? null, error: null }) as any;
  }
  single() {
    return Promise.resolve({ data: this.rows()[0] ?? null, error: null }) as any;
  }
  then<R1 = { data: T; error: null }, R2 = never>(
    onfulfilled?: ((value: { data: T; error: null }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve({ data: this.rows() as T, error: null }).then(
      onfulfilled as any,
      onrejected as any,
    );
  }
}

export function demoFrom(table: string) {
  return new DemoQuery(table);
}

export function demoInsert(table: string, values: any) {
  const rows = demoRows(table);
  const row = {
    id: `${table}-${Math.random().toString(36).slice(2, 10)}`,
    user_id: DEMO_USER.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...values,
  };
  rows.unshift(row);
  return row;
}

export function demoUpdate(table: string, id: string, values: any) {
  const rows = demoRows(table);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...values, updated_at: new Date().toISOString() };
  return rows[idx];
}

export function demoDelete(table: string, id: string) {
  const rows = demoRows(table);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx !== -1) rows.splice(idx, 1);
  return id;
}
