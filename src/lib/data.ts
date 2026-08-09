/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { demoDelete, demoFrom, demoInsert, demoUpdate, isDemo } from "@/lib/demo";

export type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables & string;
export type Row<K extends TableName> = Tables[K]["Row"];
export type Insert<K extends TableName> = Tables[K]["Insert"];
export type Update<K extends TableName> = Tables[K]["Update"];

export type Subject = Row<"subjects">;
export type Unit = Row<"units">;
export type Topic = Row<"topics">;
export type Note = Row<"notes">;
export type Flashcard = Row<"flashcards">;
export type Assignment = Row<"assignments">;
export type Exam = Row<"exams">;
export type Paper = Row<"papers">;
export type Resource = Row<"resources">;
export type StudySession = Row<"study_sessions">;
export type Profile = Row<"profiles">;

/** Table entry point that transparently swaps to the in-memory demo store. */
export function db(table: string): any {
  return isDemo() ? demoFrom(table) : (supabase.from(table as TableName) as any);
}

export const DEMO_LOCKED_MESSAGE =
  "This feature is available after creating an account.";

export function demoGuard(): boolean {
  if (!isDemo()) return false;
  toast.info(DEMO_LOCKED_MESSAGE);
  return true;
}

type Builder = (q: any) => any;

export function useList<K extends TableName>(
  table: K,
  opts?: { key?: QueryKey; build?: Builder; enabled?: boolean },
) {
  return useQuery({
    queryKey: [table, ...(opts?.key ?? [])],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      let q: any = db(table).select("*");
      if (opts?.build) q = opts.build(q);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Row<K>[];
    },
  });
}

export function useOne<K extends TableName>(table: K, id: string | undefined) {
  return useQuery({
    queryKey: [table, "one", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db(table)
        .select("*")
        .eq("id", id as string)
        .maybeSingle();
      if (error) throw error;
      return data as Row<K> | null;
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, table: string) {
  qc.invalidateQueries({ queryKey: [table] });
  qc.invalidateQueries({ queryKey: ["stats"] });
  qc.invalidateQueries({ queryKey: ["search"] });
}

export function useCreate<K extends TableName>(table: K, message?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Insert<K>) => {
      if (isDemo()) return demoInsert(table, values) as Row<K>;
      const { data, error } = await (supabase.from(table) as any)
        .insert(values as any)
        .select()
        .single();
      if (error) throw error;
      return data as Row<K>;
    },
    onSuccess: () => {
      invalidate(qc, table);
      if (message) toast.success(message);
    },
    onError: (e: any) => toast.error(e.message ?? "Something went wrong"),
  });
}

export function useUpdate<K extends TableName>(table: K, opts?: { silent?: boolean }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Update<K> }) => {
      if (isDemo()) return demoUpdate(table, id, values) as Row<K>;
      const { data, error } = await (supabase.from(table) as any)
        .update(values as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Row<K>;
    },
    onSuccess: () => {
      invalidate(qc, table);
      if (!opts?.silent) toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
  });
}

export function useRemove<K extends TableName>(table: K, message = "Deleted") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) return demoDelete(table, id);
      const { error } = await (supabase.from(table) as any).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      invalidate(qc, table);
      toast.success(message);
    },
    onError: (e: any) => toast.error(e.message ?? "Could not delete"),
  });
}
