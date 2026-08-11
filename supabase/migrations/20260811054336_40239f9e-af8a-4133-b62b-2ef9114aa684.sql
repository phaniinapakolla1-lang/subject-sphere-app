-- 1. Course fields on subjects
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'students',
  ADD COLUMN IF NOT EXISTS is_course boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS learning_outcomes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS subjects_slug_key ON public.subjects (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS subjects_status_idx ON public.subjects (status);

-- 2. Content blocks
CREATE TABLE IF NOT EXISTS public.topic_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'text',
  title text,
  body text NOT NULL DEFAULT '',
  caption text,
  url text,
  storage_path text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topic_blocks_topic_idx ON public.topic_blocks (topic_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_blocks TO authenticated;
GRANT SELECT ON public.topic_blocks TO anon;
GRANT ALL ON public.topic_blocks TO service_role;
ALTER TABLE public.topic_blocks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_topic_blocks_updated BEFORE UPDATE ON public.topic_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Access rules
CREATE TABLE IF NOT EXISTS public.course_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'student',
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course text,
  semester_label text,
  section text,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_access_subject_idx ON public.course_access (subject_id);
CREATE INDEX IF NOT EXISTS course_access_student_idx ON public.course_access (student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_access TO authenticated;
GRANT ALL ON public.course_access TO service_role;
ALTER TABLE public.course_access ENABLE ROW LEVEL SECURITY;

-- 4. Progress
CREATE TABLE IF NOT EXISTS public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'opened',
  opened_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);
CREATE INDEX IF NOT EXISTS course_progress_user_subject_idx ON public.course_progress (user_id, subject_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_progress TO authenticated;
GRANT ALL ON public.course_progress TO service_role;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_course_progress_updated BEFORE UPDATE ON public.course_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Readability helper
CREATE OR REPLACE FUNCTION public.can_read_course(_subject_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subjects s
    WHERE s.id = _subject_id
      AND (
        s.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR (s.status = 'published' AND s.visibility = 'public')
        OR (
          s.status = 'published'
          AND auth.uid() IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.course_access a
            LEFT JOIN public.profiles p ON p.id = auth.uid()
            WHERE a.subject_id = s.id
              AND (
                a.scope IN ('everyone', 'all_students')
                OR (a.scope = 'student' AND a.student_id = auth.uid())
                OR (a.scope = 'course' AND p.course IS NOT DISTINCT FROM a.course)
                OR (a.scope = 'semester' AND p.semester_label IS NOT DISTINCT FROM a.semester_label)
                OR (a.scope = 'section' AND p.section IS NOT DISTINCT FROM a.section)
              )
          )
        )
      )
  );
$$;
REVOKE ALL ON FUNCTION public.can_read_course(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_course(uuid) TO anon, authenticated;

-- 6. Policies: course reading + admin management
CREATE POLICY "read accessible courses" ON public.subjects
  FOR SELECT TO anon, authenticated USING (public.can_read_course(id));
CREATE POLICY "admins manage courses" ON public.subjects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "read accessible units" ON public.units
  FOR SELECT TO anon, authenticated USING (public.can_read_course(subject_id));
CREATE POLICY "admins manage units" ON public.units
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "read accessible topics" ON public.topics
  FOR SELECT TO anon, authenticated USING (public.can_read_course(subject_id));
CREATE POLICY "admins manage topics" ON public.topics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.subjects TO anon;
GRANT SELECT ON public.units TO anon;
GRANT SELECT ON public.topics TO anon;

CREATE POLICY "own blocks" ON public.topic_blocks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read accessible blocks" ON public.topic_blocks
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.topics t WHERE t.id = topic_id AND public.can_read_course(t.subject_id)));
CREATE POLICY "admins manage blocks" ON public.topic_blocks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage access" ON public.course_access
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "read own access rows" ON public.course_access
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "own progress" ON public.course_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read progress" ON public.course_progress
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));