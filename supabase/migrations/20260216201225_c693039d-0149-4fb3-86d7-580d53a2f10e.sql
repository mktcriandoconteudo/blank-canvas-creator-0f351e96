-- Update confirm_np_purchase to accept both 'pending' and 'awaiting_approval' statuses
CREATE OR REPLACE FUNCTION public.confirm_np_purchase(_purchase_id uuid, _wallet text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _purchase RECORD;
BEGIN
  SELECT * INTO _purchase FROM np_purchases
  WHERE id = _purchase_id AND wallet_address = _wallet AND status IN ('pending', 'awaiting_approval')
  FOR UPDATE;

  IF _purchase IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'purchase_not_found');
  END IF;

  -- Creditar NP ao jogador
  UPDATE users SET nitro_points = nitro_points + _purchase.np_amount
  WHERE wallet_address = _wallet;

  -- Atualizar status da compra
  UPDATE np_purchases SET status = 'confirmed', confirmed_at = now()
  WHERE id = _purchase_id;

  -- Registrar evento econômico (mint)
  INSERT INTO economy_events (event_type, amount, wallet, description)
  VALUES ('mint', _purchase.np_amount, _wallet, 'pix_purchase_' || _purchase.np_amount || 'NP');

  -- Atualizar total_minted no economy_state
  UPDATE economy_state SET
    total_minted = total_minted + _purchase.np_amount,
    updated_at = now()
  WHERE id = (SELECT id FROM economy_state LIMIT 1);

  RETURN jsonb_build_object(
    'success', true,
    'np_credited', _purchase.np_amount,
    'price_brl', _purchase.price_brl
  );
END;
$function$;