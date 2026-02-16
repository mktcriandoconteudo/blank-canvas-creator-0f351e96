-- Fix RLS for np_purchases: allow insert/update via x-wallet-address header (consistent with rest of app)
DROP POLICY IF EXISTS "Users can create purchases" ON public.np_purchases;
CREATE POLICY "Users can create purchases" ON public.np_purchases
  FOR INSERT
  WITH CHECK (
    wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
    OR wallet_address = (SELECT u.wallet_address FROM users u WHERE u.auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own pending purchases" ON public.np_purchases;
CREATE POLICY "Users can update own pending purchases" ON public.np_purchases
  FOR UPDATE
  USING (
    status = 'pending'
    AND (
      wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
      OR wallet_address = (SELECT u.wallet_address FROM users u WHERE u.auth_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own purchases" ON public.np_purchases;
CREATE POLICY "Users can view own purchases" ON public.np_purchases
  FOR SELECT
  USING (
    wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
    OR wallet_address = (SELECT u.wallet_address FROM users u WHERE u.auth_id = auth.uid())
    OR check_is_admin()
  );

-- Also drop the separate admin select policy since it's now merged
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.np_purchases;