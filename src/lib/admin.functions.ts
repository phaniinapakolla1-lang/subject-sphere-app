/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export type StudentRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  student_id: string | null;
  course: string | null;
  semester_label: string | null;
  section: string | null;
  academic_year: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string;
  role: string;
};

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select(
          "id,email,display_name,student_id,course,semester_label,section,academic_year,status,last_login_at,created_at",
        )
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id,role"),
    ]);
    const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
    return ((profiles ?? []) as any[]).map((p) => ({
      ...p,
      role: roleMap.get(p.id) ?? "student",
    })) as StudentRow[];
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }, { count: subjects }, { count: topics }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id,status,created_at,last_login_at"),
        supabaseAdmin.from("user_roles").select("user_id,role"),
        supabaseAdmin.from("subjects").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("topics").select("id", { count: "exact", head: true }),
      ]);
    const adminIds = new Set(
      (roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id),
    );
    const students = (profiles ?? []).filter((p: any) => !adminIds.has(p.id));
    const weekAgo = Date.now() - 7 * 86400000;
    return {
      totalStudents: students.length,
      activeStudents: students.filter((s: any) => s.status === "active").length,
      suspendedStudents: students.filter((s: any) => s.status !== "active").length,
      newThisWeek: students.filter((s: any) => Date.parse(s.created_at) >= weekAgo).length,
      activeThisWeek: students.filter(
        (s: any) => s.last_login_at && Date.parse(s.last_login_at) >= weekAgo,
      ).length,
      admins: adminIds.size,
      subjects: subjects ?? 0,
      topics: topics ?? 0,
    };
  });

export type StudentInput = {
  email: string;
  password: string;
  display_name: string;
  student_id?: string;
  course?: string;
  semester_label?: string;
  section?: string;
  academic_year?: string;
  role?: "student" | "admin";
};

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StudentInput) => {
    if (!input.email?.includes("@")) throw new Error("A valid email is required");
    if (!input.password || input.password.length < 8)
      throw new Error("Password must be at least 8 characters");
    if (!input.display_name?.trim()) throw new Error("Full name is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.display_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create account");

    const id = created.user.id;
    await supabaseAdmin.from("profiles").upsert({
      id,
      email: data.email,
      display_name: data.display_name,
      student_id: data.student_id ?? null,
      course: data.course ?? null,
      semester_label: data.semester_label ?? null,
      section: data.section ?? null,
      academic_year: data.academic_year ?? null,
      status: "active",
    } as any);
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: id, role: data.role ?? "student" } as any, {
        onConflict: "user_id,role",
      });
    return { id };
  });

export const updateStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; values: Partial<StudentInput> }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { role, password, ...profile } = data.values;
    if (Object.keys(profile).length) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(profile as any)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    if (password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password });
      if (error) throw new Error(error.message);
    }
    if (role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role } as any);
    }
    return { ok: true };
  });

export const setStudentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "active" | "suspended" }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ status: data.status } as any)
      .eq("id", data.id);
    await supabaseAdmin.auth.admin.updateUserById(data.id, {
      ban_duration: data.status === "suspended" ? "876000h" : "none",
    } as any);
    return { ok: true };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id === context.userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const touchLastLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() } as any)
      .eq("id", context.userId);
    return { ok: true };
  });
