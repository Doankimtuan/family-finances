-- Migration: Add bid_price and ask_price to asset_price_history and create sync trigger for asset quantity

-- 1. Alter asset_price_history to add bid_price and ask_price columns
ALTER TABLE public.asset_price_history
  ADD COLUMN bid_price numeric(18,0),
  ADD COLUMN ask_price numeric(18,0);

COMMENT ON COLUMN public.asset_price_history.bid_price IS 'The price at which the dealer buys (the customer/user sells).';
COMMENT ON COLUMN public.asset_price_history.ask_price IS 'The price at which the dealer sells (the customer/user buys).';

-- 2. Backfill existing rows with unit_price
UPDATE public.asset_price_history
  SET bid_price = unit_price,
      ask_price = unit_price
  WHERE bid_price IS NULL;

-- 3. Create or replace function to sync asset quantity
CREATE OR REPLACE FUNCTION public.sync_asset_quantity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_latest_quantity numeric(20,6);
BEGIN
  -- Get the quantity of the latest entry by as_of_date desc
  SELECT quantity INTO v_latest_quantity
  FROM public.asset_quantity_history
  WHERE asset_id = COALESCE(NEW.asset_id, OLD.asset_id)
  ORDER BY as_of_date DESC, created_at DESC
  LIMIT 1;

  -- Update assets table
  UPDATE public.assets
  SET quantity = COALESCE(v_latest_quantity, 0)
  WHERE id = COALESCE(NEW.asset_id, OLD.asset_id);

  RETURN NULL;
END;
$$;

-- 4. Create trigger to run after quantity history updates
DROP TRIGGER IF EXISTS trg_sync_asset_quantity ON public.asset_quantity_history;
CREATE TRIGGER trg_sync_asset_quantity
AFTER INSERT OR UPDATE OR DELETE ON public.asset_quantity_history
FOR EACH ROW EXECUTE FUNCTION public.sync_asset_quantity();
