-- ============================================================================
-- 00016_fix_billing_trigger.sql
-- Fix null description in card_billing_items + improved trigger logic
-- ============================================================================

-- 1. Allow description to have a default empty string to prevent NOT NULL violations
--    when a transaction has no description text
ALTER TABLE public.card_billing_items
  ALTER COLUMN description SET DEFAULT '';

-- 3. Re-create the credit card transaction trigger with a COALESCE fix
--    so NULL descriptions from transactions don't violate the constraint.
CREATE OR REPLACE FUNCTION public.handle_credit_card_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_is_credit_card BOOLEAN;
  v_statement_day INTEGER;
  v_billing_month DATE;
  v_billing_month_id UUID;
  v_description TEXT;
BEGIN
  -- 1. Check if the account is a credit card
  SELECT household_id, (type = 'credit_card')
  INTO v_household_id, v_is_credit_card
  FROM public.accounts WHERE id = NEW.account_id;

  IF NOT v_is_credit_card OR v_is_credit_card IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Only handle expenses (card spending); skip income and transfers
  IF NEW.type NOT IN ('expense', 'income') THEN
    RETURN NEW;
  END IF;

  -- 3. Get statement day from settings (default 25 if not configured)
  SELECT statement_day INTO v_statement_day
  FROM public.credit_card_settings WHERE account_id = NEW.account_id;
  
  v_statement_day := COALESCE(v_statement_day, 25);

  -- 4. Calculate billing month based on statement day
  IF EXTRACT(DAY FROM NEW.transaction_date) > v_statement_day THEN
    v_billing_month := (NEW.transaction_date + INTERVAL '1 month')::DATE;
  ELSE
    v_billing_month := NEW.transaction_date;
  END IF;
  
  v_billing_month := DATE_TRUNC('month', v_billing_month)::DATE;

  -- 5. Upsert billing month record
  INSERT INTO public.card_billing_months (household_id, card_account_id, billing_month)
  VALUES (v_household_id, NEW.account_id, v_billing_month)
  ON CONFLICT (card_account_id, billing_month) DO NOTHING;
  
  SELECT id INTO v_billing_month_id 
  FROM public.card_billing_months 
  WHERE card_account_id = NEW.account_id AND billing_month = v_billing_month;

  -- 6. Build description with fallback for NULL / empty descriptions
  v_description := COALESCE(
    NULLIF(TRIM(NEW.description), ''),
    'Giao dịch thẻ ' || TO_CHAR(NEW.transaction_date, 'DD/MM/YYYY')
  );

  -- 7. Insert billing item (Type 1 - standard)
  INSERT INTO public.card_billing_items (
    household_id, card_account_id, billing_month_id, transaction_id, 
    description, amount, item_type
  )
  VALUES (
    v_household_id, NEW.account_id, v_billing_month_id, NEW.id,
    v_description, NEW.amount, 'standard'
  );

  -- 8. Update statement_amount for this billing cycle
  UPDATE public.card_billing_months
  SET 
    statement_amount = statement_amount + (
      CASE 
        WHEN NEW.type = 'expense' THEN NEW.amount 
        ELSE -NEW.amount 
      END
    ),
    updated_at = now()
  WHERE id = v_billing_month_id;

  RETURN NEW;
END;
$$;
