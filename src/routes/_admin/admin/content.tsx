import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  Loader2,
  MoveDown,
  MoveUp,
  Pencil,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui-kit";
import { useCreate, useList, useRemove, useUpdate, type Row } from "@/lib/data";
import { syllabusImport } from "@/lib/content.functions";
import { parseSyllabus, syllabusCounts, SYLLABUS_SAMPLE, type ParsedSyllabus } from "@/lib/syllabus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/content")({
  head: () => ({
    meta: [
      { title: "Content manager — StudyOS admin" },
      {
        name: "description",
        content:
          "Manage the full academic tree: courses, subjects, units, topics and their published state.",
      },
      { property: "og:title", content: "Content manager — StudyOS admin" },
      {
        property: "og:description",
        content: "Build and publish the Course → Subject → Unit → Topic academic structure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminContent,
});

type Course = Row<"courses">;
type Subject = Row<"subjects">;
type Unit = Row<"units">;
type Topic = Row<"topics">;

function AdminContent() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [importOpen, setImportOpen] = useState(false);

  const courses = useList("courses", {
    key: ["tree"],
    build: (q) => q.order("position", { ascending: true }),
  });
  const subjects = useList("subjects", {
    key: ["tree"],
    build: (q) => q.order("position", { ascending: true }),
  });
  const units = useList("units", {
    key: ["tree"],
    build: (q) => q.order("position", { ascending: true }),
  });
  const topics = useList("topics", {
    key: ["tree"],
    build: (q) => q.select("id,title,unit_id,subject_id,position,published").order("position"),
  });

  const createCourse = useCreate("courses", "Course added");
  const updateCourse = useUpdate("courses");
  const removeCourse = useRemove("courses", "Course removed");
  const createSubject = useCreate("subjects", "Subject added");
  const updateSubject = useUpdate("subjects");
  const removeSubject = useRemove("subjects", "Subject removed");
  const createUnit = useCreate("units", "Unit added");
  const updateUnit = useUpdate("units");
  const removeUnit = useRemove("units", "Unit removed");
  const createTopic = useCreate("topics", "Topic added");
  const updateTopic = useUpdate("topics");
  const removeTopic = useRemove("topics", "Topic removed");

  const subjectsByCourse = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const s of subjects.data ?? []) {
      const key = s.course_id ?? "__none";
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [subjects.data]);

  const unitsBySubject = useMemo(() => {
    const map = new Map<string, Unit[]>();
    for (const u of units.data ?? []) {
      map.set(u.subject_id, [...(map.get(u.subject_id) ?? []), u]);
    }
    return map;
  }, [units.data]);

  const topicsByUnit = useMemo(() => {
    const map = new Map<string, Topic[]>();
    for (const t of (topics.data ?? []) as Topic[]) {
      map.set(t.unit_id, [...(map.get(t.unit_id) ?? []), t]);
    }
    return map;
  }, [topics.data]);

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const refresh = () => qc.invalidateQueries();

  function rename(kind: "course" | "subject" | "unit" | "topic", id: string, current: string) {
    const next = window.prompt("New name", current)?.trim();
    if (!next || next === current) return;
    if (kind === "course") updateCourse.mutate({ id, values: { name: next } });
    if (kind === "subject") updateSubject.mutate({ id, values: { name: next } });
    if (kind === "unit") updateUnit.mutate({ id, values: { name: next } });
    if (kind === "topic") updateTopic.mutate({ id, values: { title: next } });
  }

  function move<T extends { id: string; position: number }>(
    list: T[],
    index: number,
    dir: -1 | 1,
    apply: (id: string, position: number) => void,
  ) {
    const target = list[index + dir];
    const current = list[index];
    if (!target || !current) return;
    apply(current.id, index + dir);
    apply(target.id, index);
  }

  const loading =
    courses.isLoading || subjects.isLoading || units.isLoading || topics.isLoading;

  const orphanSubjects = subjectsByCourse.get("__none") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content manager"
        subtitle="Course → Subject → Unit → Topic. Everything students read lives here."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Wand2 className="size-4" /> Import syllabus
            </Button>
            <Button
              onClick={() => {
                const name = window.prompt("Course name (e.g. MBA 1st Semester)")?.trim();
                if (name)
                  createCourse.mutate({ name, position: (courses.data?.length ?? 0) } as never);
              }}
            >
              <Plus className="size-4" /> Add course
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading academic tree…
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          {(courses.data ?? []).length === 0 && orphanSubjects.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No courses yet. Add a course or import a syllabus to get started.
            </div>
          ) : null}

          {(courses.data ?? []).map((course: Course, ci: number) => {
            const courseSubjects = subjectsByCourse.get(course.id) ?? [];
            const isOpen = open[course.id] ?? true;
            return (
              <div key={course.id} className="border-b border-border last:border-b-0">
                <Node
                  icon={<GraduationCap className="size-4 text-primary" />}
                  label={course.name}
                  meta={`${courseSubjects.length} subject${courseSubjects.length === 1 ? "" : "s"}`}
                  depth={0}
                  open={isOpen}
                  onToggle={() => toggle(course.id)}
                  published={course.status === "published"}
                  onPublish={() =>
                    updateCourse.mutate({
                      id: course.id,
                      values: { status: course.status === "published" ? "draft" : "published" },
                    })
                  }
                  onRename={() => rename("course", course.id, course.name)}
                  onUp={
                    ci > 0
                      ? () =>
                          move(courses.data ?? [], ci, -1, (id, position) =>
                            updateCourse.mutate({ id, values: { position } }, { onSuccess: refresh }),
                          )
                      : undefined
                  }
                  onDown={
                    ci < (courses.data?.length ?? 0) - 1
                      ? () =>
                          move(courses.data ?? [], ci, 1, (id, position) =>
                            updateCourse.mutate({ id, values: { position } }, { onSuccess: refresh }),
                          )
                      : undefined
                  }
                  onDelete={() => {
                    if (window.confirm(`Delete course "${course.name}"? Subjects stay, unlinked.`))
                      removeCourse.mutate(course.id);
                  }}
                  onAdd={() => {
                    const name = window.prompt("Subject name")?.trim();
                    if (name)
                      createSubject.mutate({
                        name,
                        course_id: course.id,
                        position: courseSubjects.length,
                      } as never);
                  }}
                  addLabel="Add subject"
                />
                {isOpen
                  ? courseSubjects.map((subject, si) => (
                      <SubjectNode
                        key={subject.id}
                        subject={subject}
                        index={si}
                        siblings={courseSubjects}
                        units={unitsBySubject.get(subject.id) ?? []}
                        topicsByUnit={topicsByUnit}
                        open={open}
                        toggle={toggle}
                        rename={rename}
                        move={move}
                        refresh={refresh}
                        updateSubject={updateSubject}
                        removeSubject={removeSubject}
                        createUnit={createUnit}
                        updateUnit={updateUnit}
                        removeUnit={removeUnit}
                        createTopic={createTopic}
                        updateTopic={updateTopic}
                        removeTopic={removeTopic}
                      />
                    ))
                  : null}
              </div>
            );
          })}

          {orphanSubjects.length > 0 ? (
            <div className="border-t border-border">
              <div className="flex items-center gap-2 bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Not linked to a course
              </div>
              {orphanSubjects.map((subject, si) => (
                <SubjectNode
                  key={subject.id}
                  subject={subject}
                  index={si}
                  siblings={orphanSubjects}
                  units={unitsBySubject.get(subject.id) ?? []}
                  topicsByUnit={topicsByUnit}
                  open={open}
                  toggle={toggle}
                  rename={rename}
                  move={move}
                  refresh={refresh}
                  updateSubject={updateSubject}
                  removeSubject={removeSubject}
                  createUnit={createUnit}
                  updateUnit={updateUnit}
                  removeUnit={removeUnit}
                  createTopic={createTopic}
                  updateTopic={updateTopic}
                  removeTopic={removeTopic}
                  courses={courses.data ?? []}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        courses={courses.data ?? []}
        onDone={refresh}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- nodes */

function Node(props: {
  icon: React.ReactNode;
  label: string;
  meta?: string | undefined;
  depth: number;
  open?: boolean | undefined;
  onToggle?: (() => void) | undefined;
  published?: boolean | undefined;
  onPublish?: (() => void) | undefined;
  onRename?: (() => void) | undefined;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onAdd?: (() => void) | undefined;
  addLabel?: string | undefined;
  href?: React.ReactNode | undefined;
}) {

  const pad = [16, 36, 60, 84][props.depth] ?? 16;
  return (
    <div
      className="group flex items-center gap-2 py-2 pr-3 hover:bg-accent/40"
      style={{ paddingLeft: pad }}
    >
      {props.onToggle ? (
        <button onClick={props.onToggle} className="text-muted-foreground hover:text-foreground">
          {props.open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      ) : (
        <span className="w-4" />
      )}
      {props.icon}
      <span className="truncate text-sm">{props.label}</span>
      {props.meta ? (
        <span className="shrink-0 text-xs text-muted-foreground">· {props.meta}</span>
      ) : null}
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
          props.published ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
        )}
      >
        {props.published ? "Published" : "Draft"}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {props.href}
        {props.onAdd ? (
          <Button variant="ghost" size="sm" title={props.addLabel} onClick={props.onAdd}>
            <Plus className="size-4" />
          </Button>
        ) : null}
        {props.onPublish ? (
          <Button
            variant="ghost"
            size="sm"
            title={props.published ? "Unpublish" : "Publish"}
            onClick={props.onPublish}
          >
            {props.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        ) : null}
        {props.onRename ? (
          <Button variant="ghost" size="sm" title="Rename" onClick={props.onRename}>
            <Pencil className="size-4" />
          </Button>
        ) : null}
        {props.onUp ? (
          <Button variant="ghost" size="sm" title="Move up" onClick={props.onUp}>
            <MoveUp className="size-4" />
          </Button>
        ) : null}
        {props.onDown ? (
          <Button variant="ghost" size="sm" title="Move down" onClick={props.onDown}>
            <MoveDown className="size-4" />
          </Button>
        ) : null}
        {props.onDelete ? (
          <Button
            variant="ghost"
            size="sm"
            title="Delete"
            className="text-destructive"
            onClick={props.onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function SubjectNode(props: {
  subject: Subject;
  index: number;
  siblings: Subject[];
  units: Unit[];
  topicsByUnit: Map<string, Topic[]>;
  open: Record<string, boolean>;
  toggle: (id: string) => void;
  rename: (k: any, id: string, current: string) => void;
  move: any;
  refresh: () => void;
  updateSubject: any;
  removeSubject: any;
  createUnit: any;
  updateUnit: any;
  removeUnit: any;
  createTopic: any;
  updateTopic: any;
  removeTopic: any;
  courses?: Course[];
}) {
  const { subject, units, topicsByUnit, open, toggle } = props;
  const isOpen = open[subject.id] ?? false;

  return (
    <div>
      <Node
        icon={<BookOpen className="size-4 text-primary/80" />}
        label={subject.name}
        meta={`${units.length} unit${units.length === 1 ? "" : "s"}`}
        depth={1}
        open={isOpen}
        onToggle={() => toggle(subject.id)}
        published={subject.status === "published"}
        onPublish={() =>
          props.updateSubject.mutate({
            id: subject.id,
            values: { status: subject.status === "published" ? "draft" : "published" },
          })
        }
        onRename={() => props.rename("subject", subject.id, subject.name)}
        onUp={
          props.index > 0
            ? () =>
                props.move(props.siblings, props.index, -1, (id: string, position: number) =>
                  props.updateSubject.mutate(
                    { id, values: { position } },
                    { onSuccess: props.refresh },
                  ),
                )
            : undefined
        }
        onDown={
          props.index < props.siblings.length - 1
            ? () =>
                props.move(props.siblings, props.index, 1, (id: string, position: number) =>
                  props.updateSubject.mutate(
                    { id, values: { position } },
                    { onSuccess: props.refresh },
                  ),
                )
            : undefined
        }
        onDelete={() => {
          if (window.confirm(`Delete subject "${subject.name}" and its units/topics?`))
            props.removeSubject.mutate(subject.id);
        }}
        onAdd={() => {
          const name = window.prompt("Unit name", `Unit ${units.length + 1}`)?.trim();
          if (name)
            props.createUnit.mutate({
              name,
              subject_id: subject.id,
              position: units.length,
              published: false,
            } as never);
        }}
        addLabel="Add unit"
        href={
          props.courses?.length ? (
            <select
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              value={subject.course_id ?? ""}
              onChange={(e) =>
                props.updateSubject.mutate({
                  id: subject.id,
                  values: { course_id: e.target.value || null },
                })
              }
            >
              <option value="">Link to course…</option>
              {props.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null
        }
      />
      {isOpen
        ? units.map((unit, ui) => {
            const topics = topicsByUnit.get(unit.id) ?? [];
            const unitOpen = open[unit.id] ?? false;
            return (
              <div key={unit.id}>
                <Node
                  icon={<Layers className="size-4 text-muted-foreground" />}
                  label={unit.name}
                  meta={`${topics.length} topic${topics.length === 1 ? "" : "s"}`}
                  depth={2}
                  open={unitOpen}
                  onToggle={() => toggle(unit.id)}
                  published={unit.published}
                  onPublish={() =>
                    props.updateUnit.mutate({
                      id: unit.id,
                      values: { published: !unit.published },
                    })
                  }
                  onRename={() => props.rename("unit", unit.id, unit.name)}
                  onUp={
                    ui > 0
                      ? () =>
                          props.move(units, ui, -1, (id: string, position: number) =>
                            props.updateUnit.mutate(
                              { id, values: { position } },
                              { onSuccess: props.refresh },
                            ),
                          )
                      : undefined
                  }
                  onDown={
                    ui < units.length - 1
                      ? () =>
                          props.move(units, ui, 1, (id: string, position: number) =>
                            props.updateUnit.mutate(
                              { id, values: { position } },
                              { onSuccess: props.refresh },
                            ),
                          )
                      : undefined
                  }
                  onDelete={() => {
                    if (window.confirm(`Delete unit "${unit.name}" and its topics?`))
                      props.removeUnit.mutate(unit.id);
                  }}
                  onAdd={() => {
                    const title = window.prompt("Topic title")?.trim();
                    if (title)
                      props.createTopic.mutate({
                        title,
                        unit_id: unit.id,
                        subject_id: subject.id,
                        position: topics.length,
                        published: false,
                      } as never);
                  }}
                  addLabel="Add topic"
                />
                {unitOpen
                  ? topics.map((topic, ti) => (
                      <Node
                        key={topic.id}
                        icon={<FileText className="size-4 text-muted-foreground" />}
                        label={topic.title}
                        depth={3}
                        published={topic.published}
                        onPublish={() =>
                          props.updateTopic.mutate({
                            id: topic.id,
                            values: { published: !topic.published },
                          })
                        }
                        onRename={() => props.rename("topic", topic.id, topic.title)}
                        onUp={
                          ti > 0
                            ? () =>
                                props.move(topics, ti, -1, (id: string, position: number) =>
                                  props.updateTopic.mutate(
                                    { id, values: { position } },
                                    { onSuccess: props.refresh },
                                  ),
                                )
                            : undefined
                        }
                        onDown={
                          ti < topics.length - 1
                            ? () =>
                                props.move(topics, ti, 1, (id: string, position: number) =>
                                  props.updateTopic.mutate(
                                    { id, values: { position } },
                                    { onSuccess: props.refresh },
                                  ),
                                )
                            : undefined
                        }
                        onDelete={() => {
                          if (window.confirm(`Delete topic "${topic.title}"?`))
                            props.removeTopic.mutate(topic.id);
                        }}
                        href={
                          <Button asChild variant="ghost" size="sm" title="Edit content">
                            <Link
                              to="/topics/$topicId"
                              params={{ topicId: topic.id }}
                              search={{ edit: true } as never}
                            >
                              <FolderOpen className="size-4" />
                            </Link>
                          </Button>
                        }
                      />
                    ))
                  : null}
              </div>
            );
          })
        : null}
    </div>
  );
}

/* ------------------------------------------------------- syllabus import */

function ImportDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courses: Course[];
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [tree, setTree] = useState<ParsedSyllabus | null>(null);
  const [courseId, setCourseId] = useState("");
  const [saving, setSaving] = useState(false);

  const counts = tree ? syllabusCounts(tree) : null;

  async function confirmImport() {
    if (!tree) return;
    setSaving(true);
    try {
      const res = await syllabusImport({
        data: {
          ...(courseId ? { courseId } : { course: tree.course }),
          subjects: tree.subjects,
        },
      });
      toast.success(
        `Imported ${res.subjects} subjects, ${res.units} units and ${res.topics} topics`,
      );
      props.onDone();
      props.onOpenChange(false);
      setText("");
      setTree(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import a syllabus</DialogTitle>
          <DialogDescription>
            Paste the syllabus text. You review the structure before anything is saved.
          </DialogDescription>
        </DialogHeader>

        {!tree ? (
          <div className="space-y-3">
            <Textarea
              rows={14}
              className="font-mono text-xs"
              placeholder={SYLLABUS_SAMPLE}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setText(SYLLABUS_SAMPLE)}>
                Use sample
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {counts?.subjects} subjects · {counts?.units} units · {counts?.topics} topics
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-6">
              <div className="font-semibold text-foreground">📚 {tree.course}</div>
              {tree.subjects.map((s, i) => (
                <div key={i} className="pl-4">
                  <div>📖 {s.name}</div>
                  {s.units.map((u, j) => (
                    <div key={j} className="pl-4">
                      <div>📂 {u.name}</div>
                      {u.topics.map((t, k) => (
                        <div key={k} className="pl-6 text-muted-foreground">
                          📄 {t.title}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Add into</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">Create new course “{tree.course}”</option>
                {props.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              value={tree.course}
              onChange={(e) => setTree({ ...tree, course: e.target.value })}
              placeholder="Course name"
              disabled={Boolean(courseId)}
            />
          </div>
        )}

        <DialogFooter>
          {tree ? (
            <>
              <Button variant="ghost" onClick={() => setTree(null)}>
                Back to text
              </Button>
              <Button onClick={confirmImport} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null} Create structure
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                const parsed = parseSyllabus(text);
                if (!parsed.subjects.length) {
                  toast.error("Could not find any units or topics in that text");
                  return;
                }
                setTree(parsed);
              }}
              disabled={!text.trim()}
            >
              Preview structure
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
