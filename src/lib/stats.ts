import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Overview = {
  subjects: number;
  topics: number;
  completedTopics: number;
  weakTopics: number;
  bookmarked: number;
  revisions: number;
  minutesToday: number;
  minutesWeek: number;
  minutesMonth: number;
  streak: number;
  weekly: { day: string; minutes: number }[];
  monthly: { week: string; minutes: number }[];
  avgSessionMinutes: number;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function useOverview() {
  return useQuery({
    queryKey: ["stats", "overview"],
    queryFn: async (): Promise<Overview> => {
      const since = new Date();
      since.setDate(since.getDate() - 89);
      const [subjectsRes, topicsRes, sessionsRes] = await Promise.all([
        supabase.from("subjects").select("id").eq("archived", false),
        supabase.from("topics").select("id,completed,weak,bookmarked,revision_count"),
        supabase
          .from("study_sessions")
          .select("minutes,started_at")
          .gte("started_at", since.toISOString()),
      ]);

      const topics = topicsRes.data ?? [];
      const sessions = sessionsRes.data ?? [];

      const today = startOfDay(new Date()).getTime();
      const weekStart = today - 6 * 86400000;
      const monthStart = today - 29 * 86400000;

      let minutesToday = 0;
      let minutesWeek = 0;
      let minutesMonth = 0;
      const byDay = new Map<number, number>();

      for (const s of sessions) {
        const t = startOfDay(new Date(s.started_at)).getTime();
        const m = Number(s.minutes ?? 0);
        byDay.set(t, (byDay.get(t) ?? 0) + m);
        if (t === today) minutesToday += m;
        if (t >= weekStart) minutesWeek += m;
        if (t >= monthStart) minutesMonth += m;
      }

      // streak: consecutive days (ending today or yesterday) with any minutes
      let streak = 0;
      let cursor = today;
      if (!byDay.get(cursor)) cursor -= 86400000;
      while ((byDay.get(cursor) ?? 0) > 0) {
        streak += 1;
        cursor -= 86400000;
      }

      const weekly = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart + i * 86400000);
        return {
          day: d.toLocaleDateString(undefined, { weekday: "short" }),
          minutes: Math.round(byDay.get(startOfDay(d).getTime()) ?? 0),
        };
      });

      const monthly = Array.from({ length: 4 }, (_, i) => {
        const from = monthStart + i * 7 * 86400000;
        let total = 0;
        for (let d = 0; d < 7; d++) total += byDay.get(from + d * 86400000) ?? 0;
        return { week: `W${i + 1}`, minutes: Math.round(total) };
      });

      return {
        subjects: subjectsRes.data?.length ?? 0,
        topics: topics.length,
        completedTopics: topics.filter((t) => t.completed).length,
        weakTopics: topics.filter((t) => t.weak).length,
        bookmarked: topics.filter((t) => t.bookmarked).length,
        revisions: topics.reduce((a, t) => a + (t.revision_count ?? 0), 0),
        minutesToday: Math.round(minutesToday),
        minutesWeek: Math.round(minutesWeek),
        minutesMonth: Math.round(minutesMonth),
        streak,
        weekly,
        monthly,
        avgSessionMinutes: sessions.length
          ? Math.round(sessions.reduce((a, s) => a + Number(s.minutes ?? 0), 0) / sessions.length)
          : 0,
      };
    },
  });
}

export function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}
