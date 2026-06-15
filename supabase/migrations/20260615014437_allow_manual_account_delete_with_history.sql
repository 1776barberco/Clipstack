-- Allow deleting manual fallback accounts without deleting historical activity.
--
-- Income and expense rows can remain accountless. This lets users remove a
-- manual bank account after connecting Plaid while preserving their history.

ALTER TABLE public.income_entries
  DROP CONSTRAINT IF EXISTS income_entries_account_id_fkey,
  ADD CONSTRAINT income_entries_account_id_fkey
    FOREIGN KEY (account_id)
    REFERENCES public.bank_accounts(id)
    ON DELETE SET NULL;

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_account_id_fkey,
  ADD CONSTRAINT expenses_account_id_fkey
    FOREIGN KEY (account_id)
    REFERENCES public.bank_accounts(id)
    ON DELETE SET NULL;
