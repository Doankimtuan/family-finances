-- ============================================================================
-- 00015_card_billing.sql
-- Advanced Billing Cycle Management for Credit Cards (Type 1 & Type 2)
-- ============================================================================

-- 1. Extend liabilities table with due date and payment account
ALTER TABLE public.liabilities
  ADD COLUMN IF NOT EXISTS due_day INTEGER,
  ADD COLUMN IF NOT EXISTS linked_payment_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.liabilities.due_day IS 'The day of the month when payment for this liability is typically due.';
COMMENT ON COLUMN public.liabilities.linked_payment_account_id IS 'The default account used to pay this liability.';

-- 2. Create card_billing_months table (Type 1 Aggregation)
CREATE TABLE IF NOT EXISTS public.card_billing_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  card_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,       -- First day of the month for this cycle (e.g., 2025-03-01)
  statement_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  due_date DATE,                     -- Calculated actual due date for this cycle
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (card_account_id, billing_month),
  CONSTRAINT cbm_status_check CHECK (status IN ('open', 'partial', 'settled'))
);

COMMENT ON TABLE public.card_billing_months IS 'Aggregated billing cycles for credit cards.';

-- 3. Create card_billing_items table (Line items for each month)
CREATE TABLE IF NOT EXISTS public.card_billing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  card_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  billing_month_id UUID NOT NULL REFERENCES public.card_billing_months(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  installment_plan_id UUID REFERENCES public.installment_plans(id) ON DELETE SET NULL,
  installment_sequence INTEGER,      -- 1 to N
  description TEXT NOT NULL,
  amount NUMERIC(18,0) NOT NULL,
  fee_amount NUMERIC(18,0) NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'standard',
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cbi_type_check CHECK (item_type IN ('standard', 'installment'))
);

COMMENT ON TABLE public.card_billing_items IS 'Line items within a billing cycle, linking transactions or installments to months.';

-- 4. Update installment_plans metadata
ALTER TABLE public.installment_plans
  ADD COLUMN IF NOT EXISTS conversion_fee_rate NUMERIC(8,6) DEFAULT 0;

-- 5. Enable RLS and Policies for new tables

ALTER TABLE public.card_billing_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_billing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view billing months for their households"
  ON public.card_billing_months FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage billing months for their households"
  ON public.card_billing_months FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view billing items for their households"
  ON public.card_billing_items FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage billing items for their households"
  ON public.card_billing_items FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- 6. Trigger for updated_at on card_billing_months
CREATE TRIGGER set_updated_at_card_billing_months
  BEFORE UPDATE ON public.card_billing_months
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. RPC for manual billing amount updates (useful for server actions)
CREATE OR REPLACE FUNCTION public.increment_statement_amount(month_id UUID, inc NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.card_billing_months
  SET statement_amount = statement_amount + inc,
      updated_at = now()
  WHERE id = month_id;
END;
$$;

-- 8. Automated Trigger for Type 1 Transactions (Standard Card Purchases)
-- When a transaction is posted to a credit card account, auto-assign to a billing month.
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
BEGIN
  -- 1. Check if the account is a credit card
  SELECT household_id, (type = 'credit_card')
  INTO v_household_id, v_is_credit_card
  FROM public.accounts WHERE id = NEW.account_id;

  IF NOT v_is_credit_card OR v_is_credit_card IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Only handle expenses/income (Type 1 standard items)
  -- Transfers are handled during settlement (FIFO)
  IF NEW.type NOT IN ('expense', 'income') THEN
    RETURN NEW;
  END IF;

  -- 3. Get statement day
  SELECT statement_day INTO v_statement_day
  FROM public.credit_card_settings WHERE account_id = NEW.account_id;
  
  v_statement_day := COALESCE(v_statement_day, 25);

  -- 4. Calculate billing month
  -- If transaction day > statement_day, it falls into next month's cycle
  IF EXTRACT(DAY FROM NEW.transaction_date) > v_statement_day THEN
    v_billing_month := (NEW.transaction_date + INTERVAL '1 month')::DATE;
  ELSE
    v_billing_month := NEW.transaction_date;
  END IF;
  
  v_billing_month := DATE_TRUNC('month', v_billing_month)::DATE;

  -- 5. Upsert billing month
  INSERT INTO public.card_billing_months (household_id, card_account_id, billing_month)
  VALUES (v_household_id, NEW.account_id, v_billing_month)
  ON CONFLICT (card_account_id, billing_month) DO NOTHING;
  
  SELECT id INTO v_billing_month_id 
  FROM public.card_billing_months 
  WHERE card_account_id = NEW.account_id AND billing_month = v_billing_month;

  -- 6. Insert billing item (Type 1)
  INSERT INTO public.card_billing_items (
    household_id, card_account_id, billing_month_id, transaction_id, 
    description, amount, item_type
  )
  VALUES (
    v_household_id, NEW.account_id, v_billing_month_id, NEW.id,
    NEW.description, NEW.amount, 'standard'
  );

  -- 7. Update total statement_amount
  UPDATE public.card_billing_months
  SET statement_amount = statement_amount + (CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE -NEW.amount END)
  WHERE id = v_billing_month_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_credit_card_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_credit_card_transaction();
