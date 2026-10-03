/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Tables that only admins may write to. Everything else stays user-owned. */
export const CONTENT_TABLES = [
  "courses",
  "subjects",
  "units",
  "topics",
  "topic_blocks",
] as const;
export type ContentTable = (typeof CONTENT_TABLES)[number];

/** Tables that physically carry authorship columns. topic_blocks does not. */
const AUTHORSHIP_TABLES = new Set(["courses", "subjects", "units", "topics"]);

/** Tables that carry a user_id ownership column. */
const OWNER_TABLES = new Set(["subjects", "units", "topics", "topic_blocks"]);

function assertTable(table: string): asserts table is ContentTable {
  if (!(CONTENT_TABLES as readonly string[]).includes(table)) {
    throw new Error(`Unsupported content table: ${table}`);
  }
}

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Only admins can manage course content");
}

async function isAdminCtx(context: any) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  return !!data;
}

const LOCKED_FIELDS = ["published", "status", "published_at", "visibility", "created_by", "updated_by"];

/** Owner (non-admin) may write only their own unpublished subjects/units/topics/blocks. */
async function assertOwnerCan(sb: any, uid: string, table: string, row: Record<string, any>) {
  const deny = () => {
    throw new Error("You can only edit your own unpublished content. Create a revision or request publication instead.");
  };
  if (table === "courses") deny();
  if (table === "subjects") {
    if (row["user_id"] !== uid || row["status"] === "published") deny();
    return;
  }
  if (table === "units" || table === "topics") {
    if (row["user_id"] !== uid || row["published"]) deny();
    return;
  }
  if (table === "topic_blocks") {
    const { data: t } = await sb.from("topics").select("user_id,published").eq("id", row["topic_id"]).maybeSingle();
    if (!t || t.user_id !== uid || t.published) deny();
  }
}

async function parentRowFor(sb: any, table: string, values: Record<string, any>) {
  if (table === "units") {
    const { data } = await sb.from("subjects").select("user_id,status").eq("id", values["subject_id"]).maybeSingle();
    return data ? { table: "subjects", row: data } : null;
  }
  if (table === "topics") {
    const { data } = await sb.from("units").select("user_id,published").eq("id", values["unit_id"]).maybeSingle();
    return data ? { table: "units", row: data } : null;
  }
  return null;
}

async function authorize(context: any, table: string, op: "create" | "update" | "delete", id?: string, values?: Record<string, any>) {
  if (await isAdminCtx(context)) return { admin: true };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sb = supabaseAdmin as any;
  const uid = context.userId as string;
  if (op === "create") {
    if (table === "subjects") return { admin: false };
    if (table === "topic_blocks") {
      await assertOwnerCan(sb, uid, table, values ?? {});
      return { admin: false };
    }
    const parent = await parentRowFor(sb, table, values ?? {});
    if (!parent) throw new Error("Parent not found");
    await assertOwnerCan(sb, uid, parent.table, parent.row);
    return { admin: false };
  }
  const { data: row } = await sb.from(table).select("*").eq("id", id).maybeSingle();
  if (!row) throw new Error("Not found");
  await assertOwnerCan(sb, uid, table, row);
  return { admin: false };
}

function stripLocked(values: Record<string, unknown>) {
  const out = { ...values };
  for (const k of LOCKED_FIELDS) delete out[k];
  return out;
}

export const contentCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string; values: Record<string, unknown> }) => {
    assertTable(input.table);
    return input;
  })
  .handler(async ({ data, context }) => {
    const auth = await authorize(context, data.table, "create", undefined, data.values as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const values: Record<string, unknown> = auth.admin ? { ...data.values } : stripLocked(data.values);
    if (OWNER_TABLES.has(data.table)) {
      values["user_id"] = auth.admin ? ((data.values as any).user_id ?? context.userId) : context.userId;
    }
    if (!auth.admin && (data.table === "units" || data.table === "topics")) values["published"] = false;
    if (AUTHORSHIP_TABLES.has(data.table)) {
      values["created_by"] = context.userId;
      values["updated_by"] = context.userId;
    }
    const { data: row, error } = await (supabaseAdmin.from(data.table as any) as any)
      .insert(values)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const contentUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string; id: string; values: Record<string, unknown> }) => {
    assertTable(input.table);
    return input;
  })
  .handler(async ({ data, context }) => {
    const auth = await authorize(context, data.table, "update", data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const base: Record<string, unknown> = auth.admin ? { ...data.values } : stripLocked(data.values);
    if (!auth.admin) delete base["user_id"];
    const { data: row, error } = await (supabaseAdmin.from(data.table as any) as any)
      .update(
        AUTHORSHIP_TABLES.has(data.table)
          ? { ...base, updated_by: context.userId }
          : base,
      )
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const contentDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string; id: string }) => {
    assertTable(input.table);
    return input;
  })
  .handler(async ({ data, context }) => {
    await authorize(context, data.table, "delete", data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from(data.table as any) as any)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

type ImportTree = {
  courseId?: string;
  course?: string;
  subjects: { name: string; units: { name: string; topics: { title: string }[] }[] }[];
};

/**
 * Creates a whole Course → Subject → Unit → Topic tree in one call.
 * Called only after the admin has reviewed the parsed preview.
 */
export const syllabusImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ImportTree) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId as string;
    const stamp = { created_by: uid, updated_by: uid };

    let courseId = data.courseId ?? null;
    if (!courseId) {
      const { data: course, error } = await supabaseAdmin
        .from("courses")
        .insert({ name: data.course?.trim() || "Untitled course", ...stamp })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      courseId = course.id;
    }

    let created = { subjects: 0, units: 0, topics: 0 };

    for (const [si, s] of data.subjects.entries()) {
      const { data: subject, error: se } = await supabaseAdmin
        .from("subjects")
        .insert({
          user_id: uid,
          course_id: courseId,
          name: s.name,
          position: si,
          ...stamp,
        })
        .select("id")
        .single();
      if (se) throw new Error(se.message);
      created.subjects++;

      for (const [ui, u] of s.units.entries()) {
        const { data: unit, error: ue } = await supabaseAdmin
          .from("units")
          .insert({
            user_id: uid,
            subject_id: subject.id,
            name: u.name,
            position: ui,
            published: false,
            ...stamp,
          })
          .select("id")
          .single();
        if (ue) throw new Error(ue.message);
        created.units++;

        if (u.topics.length) {
          const { error: te } = await supabaseAdmin.from("topics").insert(
            u.topics.map((t, ti) => ({
              user_id: uid,
              subject_id: subject.id,
              unit_id: unit.id,
              title: t.title,
              position: ti,
              published: false,
              ...stamp,
            })),
          );
          if (te) throw new Error(te.message);
          created.topics += u.topics.length;
        }
      }
    }

    return { courseId, ...created };
  });
