/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Scope = "topic" | "unit" | "subject" | "course";
const SCOPES: Scope[] = ["topic", "unit", "subject", "course"];

async function isAdmin(context: any) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  return !!data;
}
async function assertAdmin(context: any) {
  if (!(await isAdmin(context))) throw new Error("Only admins can review requests");
}
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/** Resolves a scope to its title, owner, counts and the subject ids it covers. */
async function describeScope(sb: any, scope: Scope, id: string) {
  if (scope === "topic") {
    const { data: t } = await sb.from("topics").select("id,title,user_id,subject_id").eq("id", id).maybeSingle();
    if (!t) throw new Error("Topic not found");
    return { title: t.title, owner: t.user_id, units: 0, topics: 1 };
  }
  if (scope === "unit") {
    const { data: u } = await sb.from("units").select("id,name,user_id").eq("id", id).maybeSingle();
    if (!u) throw new Error("Unit not found");
    const { count } = await sb.from("topics").select("id", { count: "exact", head: true }).eq("unit_id", id);
    return { title: u.name, owner: u.user_id, units: 1, topics: count ?? 0 };
  }
  let subjectIds: string[];
  let title: string;
  let owner: string | null;
  if (scope === "subject") {
    const { data: s } = await sb.from("subjects").select("id,name,user_id").eq("id", id).maybeSingle();
    if (!s) throw new Error("Subject not found");
    subjectIds = [s.id];
    title = s.name;
    owner = s.user_id;
  } else {
    const { data: c } = await sb.from("courses").select("id,name,created_by").eq("id", id).maybeSingle();
    if (!c) throw new Error("Course not found");
    const { data: subs } = await sb.from("subjects").select("id").eq("course_id", id);
    subjectIds = (subs ?? []).map((s: any) => s.id);
    title = c.name;
    owner = c.created_by;
  }
  if (!subjectIds.length) return { title, owner, units: 0, topics: 0 };
  const { count: units } = await sb.from("units").select("id", { count: "exact", head: true }).in("subject_id", subjectIds);
  const { count: topics } = await sb.from("topics").select("id", { count: "exact", head: true }).in("subject_id", subjectIds);
  return { title, owner, units: units ?? 0, topics: topics ?? 0 };
}

export const previewPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { scope: Scope; id: string }) => {
    if (!SCOPES.includes(i.scope)) throw new Error("Invalid scope");
    return i;
  })
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const d = await describeScope(sb, data.scope, data.id);
    const { data: existing } = await sb
      .from("publication_requests")
      .select("id,status,feedback")
      .eq("scope_type", data.scope)
      .eq("scope_id", data.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return {
      title: d.title,
      units: d.units,
      topics: d.topics,
      canRequest: d.owner === context.userId || (await isAdmin(context)),
      latest: existing ?? null,
    };
  });

export const requestPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { scope: Scope; id: string }) => {
    if (!SCOPES.includes(i.scope)) throw new Error("Invalid scope");
    return i;
  })
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const d = await describeScope(sb, data.scope, data.id);
    if (d.owner !== context.userId && !(await isAdmin(context))) {
      throw new Error("You can only request publication of your own content");
    }
    const { data: open } = await sb
      .from("publication_requests")
      .select("id,status")
      .eq("scope_type", data.scope)
      .eq("scope_id", data.id)
      .in("status", ["pending_review", "changes_requested"])
      .maybeSingle();
    const patch = {
      status: "pending_review",
      title: d.title,
      unit_count: d.units,
      topic_count: d.topics,
      submitted_at: new Date().toISOString(),
    };
    if (open) {
      if (open.status === "pending_review") throw new Error("A request for this content is already pending review");
      const { error } = await sb.from("publication_requests").update(patch).eq("id", open.id);
      if (error) throw new Error(error.message);
      return { id: open.id };
    }
    if (data.scope === "topic") {
      await sb.from("topic_revisions").update({ status: "pending_review" }).eq("topic_id", data.id).eq("status", "draft");
    }
    const { data: row, error } = await sb
      .from("publication_requests")
      .insert({ ...patch, requester_id: context.userId, scope_type: data.scope, scope_id: data.id })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const resubmitRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const { data: r } = await sb.from("publication_requests").select("*").eq("id", data.id).maybeSingle();
    if (!r || r.requester_id !== context.userId) throw new Error("Request not found");
    if (r.status !== "changes_requested") throw new Error("Only requests with changes requested can be resubmitted");
    const d = await describeScope(sb, r.scope_type, r.scope_id);
    if (r.scope_type === "topic") {
      await sb.from("topic_revisions").update({ status: "pending_review" }).eq("topic_id", r.scope_id).in("status", ["draft", "changes_requested"]);
    }
    const { error } = await sb
      .from("publication_requests")
      .update({ status: "pending_review", title: d.title, unit_count: d.units, topic_count: d.topics, submitted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("publication_requests" as any)
      .select("*")
      .eq("requester_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const adminListRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { status?: string }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = await admin();
    let q = sb.from("publication_requests").select("*").order("submitted_at", { ascending: false }).limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const ids = [...new Set((rows ?? []).map((r: any) => r.requester_id))];
    const { data: profiles } = ids.length
      ? await sb.from("profiles").select("id,display_name,email").in("id", ids)
      : { data: [] };
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name || p.email]));
    return (rows ?? []).map((r: any) => ({ ...r, requester_name: byId.get(r.requester_id) ?? "Unknown" })) as any[];
  });

export const adminGetRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = await admin();
    const { data: r } = await sb.from("publication_requests").select("*").eq("id", data.id).maybeSingle();
    if (!r) throw new Error("Request not found");
    const { data: p } = await sb.from("profiles").select("display_name,email").eq("id", r.requester_id).maybeSingle();
    let revision = null;
    if (r.scope_type === "topic") {
      const { data: rev } = await sb
        .from("topic_revisions")
        .select("*")
        .eq("topic_id", r.scope_id)
        .in("status", ["pending_review", "changes_requested", "draft"])
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      revision = rev;
    }
    return { ...r, requester_name: p?.display_name || p?.email || "Unknown", revision } as any;
  });

/** Lazy, one-level-at-a-time hierarchy for the review page. */
export const adminReviewChildren = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { kind: "course" | "subject" | "unit" | "topic"; id: string }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = await admin();
    if (data.kind === "course") {
      const { data: rows } = await sb.from("subjects").select("id,name,status").eq("course_id", data.id).order("position");
      return (rows ?? []).map((r: any) => ({ id: r.id, kind: "subject", label: r.name, published: r.status === "published" }));
    }
    if (data.kind === "subject") {
      const { data: rows } = await sb.from("units").select("id,name,published").eq("subject_id", data.id).order("position");
      return (rows ?? []).map((r: any) => ({ id: r.id, kind: "unit", label: r.name, published: r.published }));
    }
    if (data.kind === "unit") {
      const { data: rows } = await sb.from("topics").select("id,title,published").eq("unit_id", data.id).order("position");
      return (rows ?? []).map((r: any) => ({ id: r.id, kind: "topic", label: r.title, published: r.published }));
    }
    const { data: rows } = await sb.from("topic_blocks").select("id,type,title,body").eq("topic_id", data.id).order("position");
    return (rows ?? []).map((r: any) => ({ id: r.id, kind: "block", label: r.title || r.type, body: r.body, published: true }));
  });

async function publishScope(sb: any, scope: Scope, id: string) {
  const now = new Date().toISOString();
  const publishSubjects = async (subjectIds: string[]) => {
    if (!subjectIds.length) return;
    await sb.from("subjects").update({ status: "published", published_at: now, visibility: "public" }).in("id", subjectIds);
    await sb.from("units").update({ published: true }).in("subject_id", subjectIds);
    await sb.from("topics").update({ published: true }).in("subject_id", subjectIds);
  };
  if (scope === "topic") {
    const { data: rev } = await sb
      .from("topic_revisions")
      .select("*")
      .eq("topic_id", id)
      .eq("status", "pending_review")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (rev) {
      const { data: t } = await sb.from("topics").select("user_id,subject_id").eq("id", id).single();
      await sb.from("topic_blocks").delete().eq("topic_id", id);
      const blocks = (rev.blocks as any[]) ?? [];
      if (blocks.length) {
        await sb.from("topic_blocks").insert(
          blocks.map((b, i) => ({
            topic_id: id,
            user_id: t.user_id,
            subject_id: t.subject_id,
            type: b.type ?? "text",
            title: b.title ?? null,
            body: b.body ?? "",
            caption: b.caption ?? null,
            url: b.url ?? null,
            storage_path: b.storage_path ?? null,
            meta: b.meta ?? {},
            position: i,
          })),
        );
      }
      await sb.from("topic_revisions").update({ status: "published" }).eq("id", rev.id);
    }
    await sb.from("topics").update({ published: true }).eq("id", id);
    return;
  }
  if (scope === "unit") {
    await sb.from("units").update({ published: true }).eq("id", id);
    await sb.from("topics").update({ published: true }).eq("unit_id", id);
    return;
  }
  if (scope === "subject") return publishSubjects([id]);
  await sb.from("courses").update({ status: "published" }).eq("id", id);
  const { data: subs } = await sb.from("subjects").select("id").eq("course_id", id);
  await publishSubjects((subs ?? []).map((s: any) => s.id));
}

export const adminDecide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; action: "approve" | "changes" | "reject"; feedback?: string }) => {
    if (i.action === "changes" && !i.feedback?.trim()) throw new Error("Feedback is required when requesting changes");
    return i;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = await admin();
    const { data: r } = await sb.from("publication_requests").select("*").eq("id", data.id).maybeSingle();
    if (!r) throw new Error("Request not found");
    const status = data.action === "approve" ? "published" : data.action === "changes" ? "changes_requested" : "rejected";
    if (data.action === "approve") await publishScope(sb, r.scope_type, r.scope_id);
    else if (r.scope_type === "topic") {
      await sb.from("topic_revisions").update({ status: status === "rejected" ? "rejected" : "changes_requested" }).eq("topic_id", r.scope_id).eq("status", "pending_review");
    }
    const { error } = await sb
      .from("publication_requests")
      .update({ status, feedback: data.feedback?.trim() || null, reviewed_at: new Date().toISOString(), reviewed_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { status };
  });

/* ---------- Revisions of published topics ---------- */

export const getMyRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { topicId: string }) => i)
  .handler(async ({ data, context }) => {
    const { data: rev } = await (context.supabase.from("topic_revisions" as any) as any)
      .select("*")
      .eq("topic_id", data.topicId)
      .eq("owner_id", context.userId)
      .in("status", ["draft", "pending_review", "changes_requested"])
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (rev ?? null) as any;
  });

export const createRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { topicId: string }) => i)
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const { data: t } = await sb.from("topics").select("user_id,published").eq("id", data.topicId).maybeSingle();
    if (!t || t.user_id !== context.userId) throw new Error("You can only revise your own topics");
    const { data: blocks } = await sb.from("topic_blocks").select("*").eq("topic_id", data.topicId).order("position");
    const { data: last } = await sb.from("topic_revisions").select("version").eq("topic_id", data.topicId).order("version", { ascending: false }).limit(1).maybeSingle();
    const { data: rev, error } = await sb
      .from("topic_revisions")
      .insert({
        topic_id: data.topicId,
        owner_id: context.userId,
        version: (last?.version ?? 1) + 1,
        blocks: (blocks ?? []).map((b: any) => ({ type: b.type, title: b.title, body: b.body, caption: b.caption, url: b.url, storage_path: b.storage_path, meta: b.meta })),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rev as any;
  });

export const saveRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; blocks: any[] }) => i)
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const { data: rev } = await sb.from("topic_revisions").select("owner_id,status").eq("id", data.id).maybeSingle();
    if (!rev || rev.owner_id !== context.userId) throw new Error("Revision not found");
    if (rev.status === "pending_review") throw new Error("This revision is under review and cannot be edited");
    const { error } = await sb.from("topic_revisions").update({ blocks: data.blocks, status: "draft" }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
