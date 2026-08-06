export type TopicField = {
  key: string;
  label: string;
  placeholder: string;
  group: "core" | "depth" | "exam" | "extra";
  rows?: number;
};

export const TOPIC_FIELDS: TopicField[] = [
  { key: "definition", label: "Definition", placeholder: "A crisp one-liner definition…", group: "core", rows: 3 },
  { key: "introduction", label: "Introduction", placeholder: "Set the context…", group: "core", rows: 4 },
  { key: "working", label: "Working", placeholder: "How does it actually work?", group: "core", rows: 5 },
  { key: "explanation", label: "Explanation", placeholder: "Detailed explanation in your own words…", group: "core", rows: 6 },
  { key: "algorithm", label: "Algorithm", placeholder: "Step 1…\nStep 2…", group: "depth", rows: 6 },
  { key: "flowchart", label: "Flowchart", placeholder: "Describe or paste ASCII / mermaid flow…", group: "depth", rows: 5 },
  { key: "diagram", label: "Diagram", placeholder: "Diagram notes or image link…", group: "depth", rows: 4 },
  { key: "examples", label: "Examples", placeholder: "Worked examples…", group: "depth", rows: 5 },
  { key: "advantages", label: "Advantages", placeholder: "- …", group: "depth", rows: 4 },
  { key: "disadvantages", label: "Disadvantages", placeholder: "- …", group: "depth", rows: 4 },
  { key: "applications", label: "Applications", placeholder: "Where is this used?", group: "depth", rows: 4 },
  { key: "memory_tricks", label: "Memory Tricks", placeholder: "Mnemonics that stick…", group: "extra", rows: 3 },
  { key: "important_points", label: "Important Points", placeholder: "- …", group: "extra", rows: 4 },
  { key: "answer_2", label: "2 Marks Answer", placeholder: "Short answer…", group: "exam", rows: 3 },
  { key: "answer_5", label: "5 Marks Answer", placeholder: "Medium answer…", group: "exam", rows: 5 },
  { key: "answer_10", label: "10 Marks Answer", placeholder: "Long answer…", group: "exam", rows: 8 },
  { key: "interview_questions", label: "Interview Questions", placeholder: "Q: …\nA: …", group: "exam", rows: 5 },
  { key: "viva_questions", label: "Viva Questions", placeholder: "Q: …\nA: …", group: "exam", rows: 5 },
  { key: "mcqs", label: "MCQs", placeholder: "1. … \n a) … b) … \n Ans: …", group: "exam", rows: 6 },
  { key: "previous_questions", label: "Previous Questions", placeholder: "Asked in 2023, 2021…", group: "exam", rows: 4 },
  { key: "references", label: "References", placeholder: "Books, links, lecture numbers…", group: "extra", rows: 3 },
  { key: "personal_notes", label: "Personal Notes", placeholder: "Anything else you want to remember…", group: "extra", rows: 5 },
];

export const TOPIC_GROUPS: { id: TopicField["group"]; label: string }[] = [
  { id: "core", label: "Core" },
  { id: "depth", label: "Deep Dive" },
  { id: "exam", label: "Exam Prep" },
  { id: "extra", label: "Extras" },
];

export const PRIORITIES = ["low", "medium", "high"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const REVISION_INTERVALS = [1, 3, 7, 16, 35];

export function nextRevisionDate(count: number): string {
  const days = REVISION_INTERVALS[Math.min(count, REVISION_INTERVALS.length - 1)] ?? 35;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
