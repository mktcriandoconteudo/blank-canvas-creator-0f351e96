-- Fix: Add explicit WITH CHECK that allows the status to change
DROP POLICY "Users can update own pending purchases" ON public.np_purchases;

CREATE POLICY "Users can update own pending purchases"
ON public.np_purchases
FOR UPDATE
USING (
  status = 'pending'
  AND (
    wallet_address = (current_setting('request.headers'::text, true)::json ->> 'x-wallet-address')
    OR wallet_address = (SELECT u.wallet_address FROM users u WHERE u.auth_id = auth.uid())
  )
)
WITH CHECK (
  status IN ('pending', 'awaiting_approval')
  AND (
    wallet_address = (current_setting('request.headers'::text, true)::json ->> 'x-wallet-address')
    OR wallet_address = (SELECT u.wallet_address FROM users u WHERE u.auth_id = auth.uid())
  )
);