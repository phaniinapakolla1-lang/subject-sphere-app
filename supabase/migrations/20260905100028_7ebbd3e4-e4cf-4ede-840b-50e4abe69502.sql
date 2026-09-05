CREATE TABLE public.planner_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  title text NOT NULL,
  notes text,
  slot_date date NOT NULL,
  start_time time,
  duration_minutes integer NOT NULL DEFAULT 60,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'planned',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_slots TO authenticated;
GRANT ALL ON public.planner_slots TO service_role;

ALTER TABLE public.planner_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own planner slots"
  ON public.planner_slots FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX planner_slots_user_date_idx ON public.planner_slots (user_id, slot_date);

CREATE TRIGGER trg_planner_slots_updated
  BEFORE UPDATE ON public.planner_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();