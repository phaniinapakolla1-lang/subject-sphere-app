
-- 1. Restrict SECURITY DEFINER helper to signed-in users only
REVOKE EXECUTE ON FUNCTION public.can_read_course(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;

DROP POLICY IF EXISTS "read accessible courses" ON public.subjects;
CREATE POLICY "read accessible courses" ON public.subjects FOR SELECT TO authenticated USING (public.can_read_course(id));

DROP POLICY IF EXISTS "read accessible units" ON public.units;
CREATE POLICY "read accessible units" ON public.units FOR SELECT TO authenticated
USING (public.can_read_course(subject_id) AND (published OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS "read accessible topics" ON public.topics;
CREATE POLICY "read accessible topics" ON public.topics FOR SELECT TO authenticated
USING (public.can_read_course(subject_id) AND (published OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS "read accessible blocks" ON public.topic_blocks;
CREATE POLICY "read accessible blocks" ON public.topic_blocks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.topics t WHERE t.id = topic_blocks.topic_id AND public.can_read_course(t.subject_id)));

REVOKE SELECT ON public.subjects, public.units, public.topics, public.topic_blocks FROM anon;

-- 2. Admin-only policies for the private export bucket
CREATE POLICY "export bucket admin select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'database_export_04_09_26' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "export bucket admin insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'database_export_04_09_26' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "export bucket admin update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'database_export_04_09_26' AND public.has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id = 'database_export_04_09_26' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "export bucket admin delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'database_export_04_09_26' AND public.has_role(auth.uid(),'admin'));

-- 3. Limit what admins may change on someone else's profile
CREATE OR REPLACE FUNCTION public.enforce_profile_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'profile identity cannot be changed';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.id THEN
    -- admin acting on another user's profile: personalization stays owner-only
    NEW.theme := OLD.theme;
    NEW.accent := OLD.accent;
    NEW.font_size := OLD.font_size;
    NEW.daily_goal_minutes := OLD.daily_goal_minutes;
    NEW.avatar_url := OLD.avatar_url;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_update_scope ON public.profiles;
CREATE TRIGGER enforce_profile_update_scope
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_update_scope();
