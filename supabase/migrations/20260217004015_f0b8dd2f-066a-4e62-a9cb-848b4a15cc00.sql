-- Allow admins to update any car (for fuel reset, etc.)
CREATE POLICY "Admins can update any car"
ON public.cars FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
