ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS description text;

UPDATE public.subjects SET created_by = user_id WHERE created_by IS NULL;
UPDATE public.units SET created_by = user_id WHERE created_by IS NULL;
UPDATE public.topics SET created_by = user_id WHERE created_by IS NULL;

DROP POLICY IF EXISTS "read accessible units" ON public.units;
CREATE POLICY "read accessible units" ON public.units
  FOR SELECT TO anon, authenticated
  USING (
    public.can_read_course(subject_id)
    AND (published OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "read accessible topics" ON public.topics;
CREATE POLICY "read accessible topics" ON public.topics
  FOR SELECT TO anon, authenticated
  USING (
    public.can_read_course(subject_id)
    AND (published OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "own subjects" ON public.subjects;
DROP POLICY IF EXISTS "own units" ON public.units;
DROP POLICY IF EXISTS "own topics" ON public.topics;
DROP POLICY IF EXISTS "own blocks" ON public.topic_blocks;
DROP POLICY IF EXISTS "admins manage courses" ON public.subjects;
DROP POLICY IF EXISTS "admins manage units" ON public.units;
DROP POLICY IF EXISTS "admins manage topics" ON public.topics;
DROP POLICY IF EXISTS "admins manage blocks" ON public.topic_blocks;

REVOKE INSERT, UPDATE, DELETE ON public.subjects FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.units FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.topic_blocks FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.topics FROM authenticated;

GRANT ALL ON public.subjects TO service_role;
GRANT ALL ON public.units TO service_role;
GRANT ALL ON public.topics TO service_role;
GRANT ALL ON public.topic_blocks TO service_role;

GRANT UPDATE (
  completed, bookmarked, favorite, weak,
  revision_count, last_revised_at, next_revision_at, updated_at
) ON public.topics TO authenticated;

CREATE POLICY "own study state" ON public.topics
  FOR UPDATE TO authenticated
  USING (public.can_read_course(subject_id))
  WITH CHECK (public.can_read_course(subject_id));