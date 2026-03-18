-- Upcoming Bills table
-- Users can log future payments (Zip, Klarna, credit cards, etc.) without creating jars
-- Status flow: pending → paid (linked to expense) or skipped

CREATE TABLE IF NOT EXISTS public.upcoming_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  category text DEFAULT 'other' CHECK (category IN ('zip', 'klarna', 'credit_card', 'personal', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'skipped')),
  is_recurring boolean DEFAULT false,
  recurring_interval text CHECK (recurring_interval IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  linked_expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for dashboard queries: user's pending bills sorted by due date
CREATE INDEX idx_upcoming_bills_user_status ON public.upcoming_bills(user_id, status, due_date)
  WHERE status = 'pending';

-- Index for calendar view: bills in a date range
CREATE INDEX idx_upcoming_bills_due_date ON public.upcoming_bills(due_date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_upcoming_bills_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_upcoming_bills_updated_at
  BEFORE UPDATE ON public.upcoming_bills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_upcoming_bills_updated_at();

-- RLS policies
ALTER TABLE public.upcoming_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own upcoming bills"
  ON public.upcoming_bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upcoming bills"
  ON public.upcoming_bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upcoming bills"
  ON public.upcoming_bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own upcoming bills"
  ON public.upcoming_bills FOR DELETE
  USING (auth.uid() = user_id);

-- RPC: Mark bill as paid and create corresponding expense
CREATE OR REPLACE FUNCTION public.mark_bill_paid(
  bill_id uuid,
  bill_user_id uuid,
  expense_bucket_id uuid DEFAULT NULL,
  expense_description text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  bill_record public.upcoming_bills;
  new_expense_id uuid;
  result json;
BEGIN
  -- Verify ownership and fetch bill
  SELECT * INTO bill_record
  FROM public.upcoming_bills
  WHERE id = bill_id AND user_id = bill_user_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found or already processed';
  END IF;

  -- Create expense record
  INSERT INTO public.expenses (
    user_id,
    bucket_id,
    amount,
    description,
    category,
    entry_date
  ) VALUES (
    bill_user_id,
    expense_bucket_id,
    bill_record.amount,
    COALESCE(expense_description, bill_record.name),
    bill_record.category,
    bill_record.due_date
  )
  RETURNING id INTO new_expense_id;

  -- Update bill status and link to expense
  UPDATE public.upcoming_bills
  SET status = 'paid',
      linked_expense_id = new_expense_id,
      updated_at = now()
  WHERE id = bill_id;

  -- If recurring, create next bill
  IF bill_record.is_recurring AND bill_record.recurring_interval IS NOT NULL THEN
    INSERT INTO public.upcoming_bills (
      user_id, name, amount, due_date, category,
      is_recurring, recurring_interval, notes
    ) VALUES (
      bill_user_id,
      bill_record.name,
      bill_record.amount,
      CASE bill_record.recurring_interval
        WHEN 'weekly' THEN bill_record.due_date + interval '7 days'
        WHEN 'biweekly' THEN bill_record.due_date + interval '14 days'
        WHEN 'monthly' THEN bill_record.due_date + interval '1 month'
        WHEN 'quarterly' THEN bill_record.due_date + interval '3 months'
      END,
      bill_record.category,
      true,
      bill_record.recurring_interval,
      bill_record.notes
    );
  END IF;

  -- Return result
  SELECT json_build_object(
    'bill_id', bill_id,
    'expense_id', new_expense_id,
    'amount', bill_record.amount
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Skip a bill (don't create expense)
CREATE OR REPLACE FUNCTION public.skip_bill(
  bill_id uuid,
  bill_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE public.upcoming_bills
  SET status = 'skipped',
      updated_at = now()
  WHERE id = bill_id AND user_id = bill_user_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found or already processed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
