-- Admin-only function to get user email from auth.users
CREATE OR REPLACE FUNCTION public.admin_get_user_email(_auth_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _auth_id
$$;

-- Only admins can call this
REVOKE EXECUTE ON FUNCTION public.admin_get_user_email(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_email(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_email(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_email(uuid) TO authenticated;