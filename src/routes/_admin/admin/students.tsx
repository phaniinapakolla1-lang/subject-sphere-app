import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, MoreHorizontal, Pencil, Search, Trash2, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import {
  createStudent,
  deleteStudent,
  listStudents,
  setStudentStatus,
  updateStudent,
  type StudentRow,
} from "@/lib/admin.functions";
import { EmptyState, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_admin/admin/students")({
  head: () => ({
    meta: [
      { title: "Student accounts — StudyOS Admin" },
      { name: "description", content: "Create, edit, suspend and remove StudyOS student accounts." },
      { property: "og:title", content: "Student accounts — StudyOS Admin" },
      { property: "og:description", content: "Administrator tools for managing student access." },
    ],
  }),
  component: StudentsPage,
});

type FormState = {
  email: string;
  password: string;
  display_name: string;
  student_id: string;
  course: string;
  semester_label: string;
  section: string;
  academic_year: string;
};

const EMPTY: FormState = {
  email: "",
  password: "",
  display_name: "",
  student_id: "",
  course: "",
  semester_label: "",
  section: "",
  academic_year: "",
};

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function StudentsPage() {
  const qc = useQueryClient();
  const fetchStudents = useServerFn(listStudents);
  const create = useServerFn(createStudent);
  const update = useServerFn(updateStudent);
  const status = useServerFn(setStudentStatus);
  const remove = useServerFn(deleteStudent);

  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "students"],
    queryFn: () => fetchStudents(),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await update({
          data: {
            id: editing.id,
            values: {
              display_name: form.display_name,
              student_id: form.student_id,
              course: form.course,
              semester_label: form.semester_label,
              section: form.section,
              academic_year: form.academic_year,
              ...(form.password ? { password: form.password } : {}),
            },
          },
        });
      } else {
        await create({ data: { ...form } });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Student updated" : "Student account created");
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
      refresh();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not save student"),
  });

  const statusMutation = useMutation({
    mutationFn: (v: { id: string; status: "active" | "suspended" }) => status({ data: v }),
    onSuccess: () => {
      toast.success("Account status updated");
      refresh();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Account deleted");
      refresh();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    const all = data ?? [];
    if (!t) return all;
    return all.filter((s) =>
      [s.email, s.display_name, s.student_id, s.course]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t)),
    );
  }, [data, term]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, password: randomPassword() });
    setOpen(true);
  }

  function openEdit(s: StudentRow) {
    setEditing(s);
    setForm({
      email: s.email ?? "",
      password: "",
      display_name: s.display_name ?? "",
      student_id: s.student_id ?? "",
      course: s.course ?? "",
      semester_label: s.semester_label ?? "",
      section: s.section ?? "",
      academic_year: s.academic_year ?? "",
    });
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Student accounts"
        subtitle="Create and manage every account that can sign in to StudyOS."
        actions={
          <Button onClick={openCreate}>
            <UserPlus className="size-4" /> New student
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, email, student ID…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No student accounts yet"
          description="Create the first student account to give someone access to StudyOS."
          action={<Button onClick={openCreate}>Create student</Button>}
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.display_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[s.course, s.semester_label, s.section].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.role === "admin" ? "default" : "secondary"}>{s.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === "active" ? "outline" : "destructive"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.last_login_at ? new Date(s.last_login_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => openEdit(s)}>
                          <Pencil className="size-4" /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const pw = randomPassword();
                            update({ data: { id: s.id, values: { password: pw } } })
                              .then(() => {
                                navigator.clipboard?.writeText(pw);
                                toast.success(`New password copied: ${pw}`);
                              })
                              .catch(() => toast.error("Could not reset password"));
                          }}
                        >
                          <KeyRound className="size-4" /> Reset password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            statusMutation.mutate({
                              id: s.id,
                              status: s.status === "active" ? "suspended" : "active",
                            })
                          }
                        >
                          <UserX className="size-4" />
                          {s.status === "active" ? "Suspend access" : "Reactivate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Delete ${s.email}? This cannot be undone.`))
                              deleteMutation.mutate(s.id);
                          }}
                        >
                          <Trash2 className="size-4" /> Delete account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit student" : "New student account"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2">
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Asha Menon"
              />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <Input
                type="email"
                disabled={!!editing}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="asha@college.edu"
              />
            </Field>
            <Field label={editing ? "New password (optional)" : "Temporary password"} className="sm:col-span-2">
              <div className="flex gap-2">
                <Input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForm({ ...form, password: randomPassword() })}
                >
                  Generate
                </Button>
              </div>
            </Field>
            <Field label="Student ID">
              <Input
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                placeholder="21CS042"
              />
            </Field>
            <Field label="Course">
              <Input
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                placeholder="B.Tech CSE"
              />
            </Field>
            <Field label="Semester">
              <Input
                value={form.semester_label}
                onChange={(e) => setForm({ ...form, semester_label: e.target.value })}
                placeholder="Semester 5"
              />
            </Field>
            <Field label="Section">
              <Input
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                placeholder="A"
              />
            </Field>
            <Field label="Academic year" className="sm:col-span-2">
              <Input
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                placeholder="2025-26"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {editing ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
