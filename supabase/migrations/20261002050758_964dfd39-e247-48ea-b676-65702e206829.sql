CREATE TABLE public.publication_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number serial,
  requester_id uuid NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('topic','unit','subject','course')),
  scope_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  unit_count integer NOT NULL DEFAULT 0,
  topic_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft','pending_review','changes_requested','approved','published','rejected')),
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.publication_requests TO authenticated;
GRANT ALL ON public.publication_requests TO service_role;
GRANT USAGE ON SEQUENCE public.publication_requests_number_seq TO service_role;
ALTER TABLE public.publication_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or admin requests" ON public.publication_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX ON public.publication_requests (requester_id);
CREATE INDEX ON public.publication_requests (status);
CREATE TRIGGER trg_publication_requests_updated BEFORE UPDATE ON public.publication_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.topic_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','changes_requested','published','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.topic_revisions TO authenticated;
GRANT ALL ON public.topic_revisions TO service_role;
ALTER TABLE public.topic_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or admin revisions" ON public.topic_revisions FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_topic_revisions_updated BEFORE UPDATE ON public.topic_revisions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "read accessible blocks" ON public.topic_blocks;
CREATE POLICY "read accessible blocks" ON public.topic_blocks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.topics t WHERE t.id = topic_blocks.topic_id AND public.can_read_course(t.subject_id)
    AND (t.published OR t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));