-- Auto-create jars when users add upcoming bills
-- Every new pending bill gets a matching fixed-amount jar so income can be set aside before the due date.

ALTER TABLE public.upcoming_bills
  ADD COLUMN IF NOT EXISTS linked_bucket_id uuid REFERENCES public.bucket_configs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_upcoming_bills_linked_bucket
  ON public.upcoming_bills(linked_bucket_id)
  WHERE linked_bucket_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_jar_for_upcoming_bill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_bucket_id uuid;
  base_priority integer;
BEGIN
  -- Only create a jar for active bills that do not already have one.
  IF NEW.status IS DISTINCT FROM 'pending' OR NEW.linked_bucket_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(priority), 0) + 10
    INTO base_priority
  FROM public.bucket_configs
  WHERE user_id = NEW.user_id;

  INSERT INTO public.bucket_configs (
    user_id,
    name,
    percentage,
    target_amount,
    due_date,
    is_tax_bucket,
    is_recurring,
    recurring_interval,
    priority,
    color
  ) VALUES (
    NEW.user_id,
    'Bill: ' || NEW.name,
    0,
    NEW.amount,
    NEW.due_date,
    false,
    COALESCE(NEW.is_recurring, false),
    CASE WHEN COALESCE(NEW.is_recurring, false) THEN NEW.recurring_interval ELSE NULL END,
    base_priority,
    CASE NEW.category
      WHEN 'zip' THEN '#14b8a6'
      WHEN 'klarna' THEN '#a855f7'
      WHEN 'credit_card' THEN '#f97316'
      WHEN 'personal' THEN '#3b82f6'
      ELSE '#71717a'
    END
  )
  RETURNING id INTO new_bucket_id;

  NEW.linked_bucket_id := new_bucket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_jar_for_upcoming_bill ON public.upcoming_bills;
CREATE TRIGGER trigger_create_jar_for_upcoming_bill
  BEFORE INSERT ON public.upcoming_bills
  FOR EACH ROW
  EXECUTE FUNCTION public.create_jar_for_upcoming_bill();

-- Keep the linked jar in sync when an unpaid bill changes.
CREATE OR REPLACE FUNCTION public.sync_jar_for_upcoming_bill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.linked_bucket_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'pending' THEN
    UPDATE public.bucket_configs
      SET name = 'Bill: ' || NEW.name,
          target_amount = NEW.amount,
          due_date = NEW.due_date,
          is_recurring = COALESCE(NEW.is_recurring, false),
          recurring_interval = CASE WHEN COALESCE(NEW.is_recurring, false) THEN NEW.recurring_interval ELSE NULL END,
          updated_at = now()
      WHERE id = NEW.linked_bucket_id
        AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_jar_for_upcoming_bill ON public.upcoming_bills;
CREATE TRIGGER trigger_sync_jar_for_upcoming_bill
  AFTER UPDATE OF name, amount, due_date, is_recurring, recurring_interval, status ON public.upcoming_bills
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_jar_for_upcoming_bill();

-- When a recurring bill is paid, the replacement bill should keep using the same jar.
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
  next_bill_id uuid;
  next_due_date date;
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

  -- If recurring, create next bill and keep it connected to the same jar
  IF bill_record.is_recurring AND bill_record.recurring_interval IS NOT NULL THEN
    next_due_date := CASE bill_record.recurring_interval
      WHEN 'weekly' THEN bill_record.due_date + interval '7 days'
      WHEN 'biweekly' THEN bill_record.due_date + interval '14 days'
      WHEN 'monthly' THEN bill_record.due_date + interval '1 month'
      WHEN 'quarterly' THEN bill_record.due_date + interval '3 months'
    END;

    INSERT INTO public.upcoming_bills (
      user_id, name, amount, due_date, category,
      is_recurring, recurring_interval, notes, linked_bucket_id
    ) VALUES (
      bill_user_id,
      bill_record.name,
      bill_record.amount,
      next_due_date,
      bill_record.category,
      true,
      bill_record.recurring_interval,
      bill_record.notes,
      bill_record.linked_bucket_id
    )
    RETURNING id INTO next_bill_id;

    IF bill_record.linked_bucket_id IS NOT NULL THEN
      UPDATE public.bucket_configs
        SET target_amount = bill_record.amount,
            due_date = next_due_date,
            is_recurring = true,
            recurring_interval = bill_record.recurring_interval,
            updated_at = now()
        WHERE id = bill_record.linked_bucket_id
          AND user_id = bill_user_id;
    END IF;
  END IF;

  -- Return result
  SELECT json_build_object(
    'bill_id', bill_id,
    'expense_id', new_expense_id,
    'next_bill_id', next_bill_id,
    'linked_bucket_id', bill_record.linked_bucket_id,
    'amount', bill_record.amount
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
