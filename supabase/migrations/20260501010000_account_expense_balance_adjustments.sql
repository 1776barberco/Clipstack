-- Keep bank account totals in sync when expenses are logged or edited.
-- Expenses can already store account_id; this adds DB-level balance automation
-- so the selected account decreases on insert and is corrected on update/delete.

CREATE OR REPLACE FUNCTION public.adjust_account_balance(
  account_id uuid,
  amount_change decimal
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF account_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.bank_accounts
  SET current_balance = current_balance + amount_change,
      updated_at = now()
  WHERE id = account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_adjust_account_for_income()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.adjust_account_balance(NEW.account_id, NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.account_id IS NOT NULL THEN
      PERFORM public.adjust_account_balance(OLD.account_id, -OLD.amount);
    END IF;
    PERFORM public.adjust_account_balance(NEW.account_id, NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.adjust_account_balance(OLD.account_id, -OLD.amount);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_adjust_account_for_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.adjust_account_balance(NEW.account_id, -NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.account_id IS NOT NULL THEN
      PERFORM public.adjust_account_balance(OLD.account_id, OLD.amount);
    END IF;
    PERFORM public.adjust_account_balance(NEW.account_id, -NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.adjust_account_balance(OLD.account_id, OLD.amount);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS adjust_account_for_income_trigger ON public.income_entries;
CREATE TRIGGER adjust_account_for_income_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.income_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_adjust_account_for_income();

DROP TRIGGER IF EXISTS adjust_account_for_expense_trigger ON public.expenses;
CREATE TRIGGER adjust_account_for_expense_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_adjust_account_for_expense();

GRANT EXECUTE ON FUNCTION public.adjust_account_balance(uuid, decimal) TO authenticated;
