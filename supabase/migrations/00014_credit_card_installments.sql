-- ============================================================================
-- 00014_credit_card_installments.sql
-- Support for deferred-payment accounts (Credit Cards) and Installment Plans.
-- ============================================================================

-- 1. Extend accounts.type to include 'credit_card'
ALTER TABLE public.accounts 
  DROP CONSTRAINT IF EXISTS accounts_type_check;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_type_check 
  CHECK (type IN ('cash', 'checking', 'savings', 'ewallet', 'brokerage', 'credit_card', 'other'));

-- 2. Create credit_card_settings table
CREATE TABLE IF NOT EXISTS public.credit_card_settings (
  account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  credit_limit NUMERIC(18,0) DEFAULT 0,
  statement_day INTEGER NOT NULL DEFAULT 25,
  due_day INTEGER NOT NULL DEFAULT 15,
  linked_bank_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  auto_pay BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT credit_card_settings_days_check CHECK (statement_day BETWEEN 1 AND 31 AND due_day BETWEEN 1 AND 31)
);

COMMENT ON TABLE public.credit_card_settings IS 'Metadata for credit card accounts including limits and billing cycles.';

-- Enable RLS for credit_card_settings
ALTER TABLE public.credit_card_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view card settings for their households"
  ON public.credit_card_settings
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage card settings for their households"
  ON public.credit_card_settings
  FOR ALL
  USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
    )
  );

-- 3. Create installment_plans table
CREATE TABLE IF NOT EXISTS public.installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  card_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  liability_id UUID REFERENCES public.liabilities(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  original_amount NUMERIC(18,0) NOT NULL,
  conversion_fee NUMERIC(18,0) NOT NULL DEFAULT 0,
  total_amount NUMERIC(18,0) NOT NULL,
  num_installments INTEGER NOT NULL,
  monthly_amount NUMERIC(18,0) NOT NULL,
  annual_rate NUMERIC(8,6) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  paid_installments INTEGER NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(18,0) NOT NULL,
  source_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT installment_plans_status_check CHECK (status IN ('active', 'completed', 'cancelled')),
  CONSTRAINT installment_plans_amount_positive CHECK (original_amount > 0),
  CONSTRAINT installment_plans_num_positive CHECK (num_installments > 0)
);

COMMENT ON TABLE public.installment_plans IS 'Tracks large purchases converted into fixed monthly installments on a credit card.';

-- Enable RLS for installment_plans
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view installment plans for their households"
  ON public.installment_plans
  FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage installment plans for their households"
  ON public.installment_plans
  FOR ALL
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- 4. Trigger for updated_at
CREATE TRIGGER set_updated_at_credit_card_settings
  BEFORE UPDATE ON public.credit_card_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_installment_plans
  BEFORE UPDATE ON public.installment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
