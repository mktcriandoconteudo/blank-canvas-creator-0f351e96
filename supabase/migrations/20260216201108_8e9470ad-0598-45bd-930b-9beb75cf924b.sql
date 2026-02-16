-- Allow admins to update np_purchases (for rejecting)
CREATE POLICY "Admins can update all purchases"
ON public.np_purchases
FOR UPDATE
USING (check_is_admin());

-- Allow admins to view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.np_purchases
FOR SELECT
USING (check_is_admin());