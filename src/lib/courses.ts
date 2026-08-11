import type { Row } from "@/lib/data";

export type Course = Row<"subjects">;

export const COURSE_STATUSES = ["draft", "ready", "published", "archived"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  ready: "Ready to publish",
  published: "Published",
  archived: "Archived",
};

export const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-warning/15 text-warning",
  published: "bg-success/15 text-success",
  archived: "bg-destructive/10 text-destructive",
};

export const VISIBILITIES = [
  { value: "public", label: "Public — anyone with the link" },
  { value: "students", label: "Students — signed-in students with access" },
  { value: "restricted", label: "Restricted — only named students" },
] as const;

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export const ACCESS_SCOPES = [
  { value: "all_students", label: "All students" },
  { value: "course", label: "By course" },
  { value: "semester", label: "By semester" },
  { value: "section", label: "By section" },
  { value: "student", label: "Specific student" },
] as const;

export function courseSlug(name: string, suffix?: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const stem = base || "course";
  return suffix ? `${stem}-${suffix}` : stem;
}

export function accessLabel(row: {
  scope: string;
  course: string | null;
  semester_label: string | null;
  section: string | null;
  student_id: string | null;
}) {
  switch (row.scope) {
    case "all_students":
      return "All students";
    case "course":
      return `Course: ${row.course ?? "—"}`;
    case "semester":
      return `Semester: ${row.semester_label ?? "—"}`;
    case "section":
      return `Section: ${row.section ?? "—"}`;
    default:
      return "Specific student";
  }
}

/** Blocking issues that must be cleared before a course can be published. */
export function publishChecklist(input: {
  course: Course;
  unitCount: number;
  topicCount: number;
}) {
  const { course, unitCount, topicCount } = input;
  return [
    { label: "Course has a name", ok: Boolean(course.name?.trim()) },
    { label: "Course has a description", ok: Boolean(course.description?.trim()) },
    { label: "At least one unit", ok: unitCount > 0 },
    { label: "At least one topic", ok: topicCount > 0 },
    { label: "Category set", ok: Boolean(course.category?.trim()) },
  ];
}
