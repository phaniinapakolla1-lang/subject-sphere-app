CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  description text,
  academic_year text,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are readable by everyone"
ON public.courses FOR SELECT
USING (archived = false OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_courses_updated
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.subjects
  ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

CREATE INDEX idx_subjects_course_id ON public.subjects(course_id);