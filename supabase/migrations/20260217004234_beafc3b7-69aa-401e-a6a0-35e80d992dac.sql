-- Allow admins to update any user (for fuel reset, NP adjustments, etc.)
CREATE POLICY "Admins can update any user"
ON public.users FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
