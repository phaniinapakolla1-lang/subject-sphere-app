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

export const contentCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string; values: Record<string, unknown> }) => {
    assertTable(input.table);
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const values: Record<string, unknown> = { ...data.values };
    if (OWNER_TABLES.has(data.table)) {
      values["user_id"] = (data.values as any).user_id ?? context.userId;
    }
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
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin.from(data.table as any) as any)
      .update({ ...data.values, updated_by: context.userId })
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
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from(data.table as any) as any)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });
