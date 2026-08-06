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

type Builder = (q: any) => any;

export function useList<K extends TableName>(
  table: K,
  opts?: { key?: QueryKey; build?: Builder; enabled?: boolean },
) {
  return useQuery({
    queryKey: [table, ...(opts?.key ?? [])],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      let q: any = supabase.from(table).select("*");
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
      const { data, error } = await (supabase.from(table) as any)
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
