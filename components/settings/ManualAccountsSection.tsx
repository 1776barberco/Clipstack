'use client'

import { ChevronLeft, ChevronRight, CreditCard, DollarSign, Landmark, Plus, Save, Star, Trash2 } from 'lucide-react'
import type { BankAccount } from '@/hooks/useBankAccounts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EditedAccount } from './types'

type ManualAccountsSectionProps = {
  accounts: BankAccount[]
  activePlaidAccountCount: number
  editedAccounts: Record<string, EditedAccount>
  saving: boolean
  showAddAccount: boolean
  newAccountName: string
  newAccountType: string
  newAccountBalance: string
  carouselIndex: number
  onShowAddAccountChange: (show: boolean) => void
  onNewAccountNameChange: (value: string) => void
  onNewAccountTypeChange: (value: string) => void
  onNewAccountBalanceChange: (value: string) => void
  onCarouselIndexChange: (value: number) => void
  onAddAccount: () => void
  onSaveAccounts: () => void
  onDeleteAccount: (id: string, name: string) => void
  onSetPrimary: (id: string) => void
  getAccountField: (id: string, field: 'name' | 'type' | 'starting_balance', fallback: string) => string
  setAccountField: (id: string, field: 'name' | 'type' | 'starting_balance', value: string) => void
}

const accountTypeLabels: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  cash: 'Cash',
  cashapp: 'Cash App',
  venmo: 'Venmo',
  other: 'Other',
}

export function ManualAccountsSection({
  accounts,
  activePlaidAccountCount,
  editedAccounts,
  saving,
  showAddAccount,
  newAccountName,
  newAccountType,
  newAccountBalance,
  carouselIndex,
  onShowAddAccountChange,
  onNewAccountNameChange,
  onNewAccountTypeChange,
  onNewAccountBalanceChange,
  onCarouselIndexChange,
  onAddAccount,
  onSaveAccounts,
  onDeleteAccount,
  onSetPrimary,
  getAccountField,
  setAccountField,
}: ManualAccountsSectionProps) {
  const currentAccount = accounts[carouselIndex]

  const resetAddAccount = () => {
    onShowAddAccountChange(false)
    onNewAccountNameChange('')
    onNewAccountTypeChange('checking')
    onNewAccountBalanceChange('')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Manual Bank Accounts
            </CardTitle>
            <CardDescription>
              Use these only for cash, manual fallback balances, or accounts you have not connected through Plaid. Linked Plaid accounts and live balances are managed above.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" className="min-h-10 w-full sm:w-auto" onClick={() => onShowAddAccountChange(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddAccount && (
          <div className="space-y-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium">Add New Account</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="newAccountName">Account Name</Label>
                <Input
                  id="newAccountName"
                  name="newAccountName"
                  placeholder="e.g. Chase Checking"
                  value={newAccountName}
                  onChange={(e) => onNewAccountNameChange(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="newAccountType">Type</Label>
                <select
                  id="newAccountType"
                  name="newAccountType"
                  value={newAccountType}
                  onChange={(e) => onNewAccountTypeChange(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <AccountTypeOptions />
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="newAccountBalance">Starting Balance</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newAccountBalance"
                  name="newAccountBalance"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0.00"
                  value={newAccountBalance}
                  onChange={(e) => onNewAccountBalanceChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" className="min-h-10" onClick={resetAddAccount}>
                Cancel
              </Button>
              <Button type="button" size="sm" className="min-h-10" onClick={onAddAccount}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          </div>
        )}

        {accounts.length === 0 && !showAddAccount && (
          <div className="space-y-2 rounded-lg border border-dashed p-6 text-center">
            <Landmark className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No manual accounts yet.</p>
            <p className="text-xs text-muted-foreground">
              {activePlaidAccountCount > 0
                ? 'Your connected Plaid accounts are already tracking live bank totals.'
                : 'Add a manual account only if you have cash or an account that is not connected through Plaid.'}
            </p>
            <Button type="button" variant="outline" size="sm" className="min-h-10" onClick={() => onShowAddAccountChange(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Manual Account
            </Button>
          </div>
        )}

        {accounts.length > 0 && (
          <>
            {accounts.length > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onCarouselIndexChange(Math.max(0, carouselIndex - 1))}
                  disabled={carouselIndex === 0}
                  aria-label="Previous manual account"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1">
                  {accounts.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Show manual account ${i + 1}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full"
                      onClick={() => onCarouselIndexChange(i)}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full transition-colors ${i === carouselIndex ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onCarouselIndexChange(Math.min(accounts.length - 1, carouselIndex + 1))}
                  disabled={carouselIndex >= accounts.length - 1}
                  aria-label="Next manual account"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {currentAccount && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {accountTypeLabels[currentAccount.type] || currentAccount.type}
                    </span>
                    {currentAccount.is_primary && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        <Star className="h-3 w-3" /> Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!currentAccount.is_primary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="min-h-10 text-xs"
                        onClick={() => onSetPrimary(currentAccount.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label={`Delete ${currentAccount.name}`}
                      onClick={() => onDeleteAccount(currentAccount.id, currentAccount.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs" htmlFor={`account-name-${currentAccount.id}`}>Account Name</Label>
                  <Input
                    id={`account-name-${currentAccount.id}`}
                    value={getAccountField(currentAccount.id, 'name', currentAccount.name)}
                    onChange={(e) => setAccountField(currentAccount.id, 'name', e.target.value)}
                    placeholder="Account name"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs" htmlFor={`account-type-${currentAccount.id}`}>Type</Label>
                    <select
                      id={`account-type-${currentAccount.id}`}
                      value={getAccountField(currentAccount.id, 'type', currentAccount.type)}
                      onChange={(e) => setAccountField(currentAccount.id, 'type', e.target.value)}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <AccountTypeOptions />
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs" htmlFor={`account-balance-${currentAccount.id}`}>Starting Balance</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id={`account-balance-${currentAccount.id}`}
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        value={getAccountField(currentAccount.id, 'starting_balance', currentAccount.starting_balance.toString())}
                        onChange={(e) => setAccountField(currentAccount.id, 'starting_balance', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Current Balance: <span className="font-medium text-foreground">${Number(currentAccount.current_balance).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            )}

            {accounts.length > 1 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-emerald-400">
                    Total across {accounts.length} accounts
                  </span>
                  <span className="font-bold text-emerald-400">
                    ${accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={onSaveAccounts}
                disabled={saving || Object.keys(editedAccounts).length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Accounts'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function AccountTypeOptions() {
  return (
    <>
      <option value="checking">Checking</option>
      <option value="savings">Savings</option>
      <option value="cash">Cash</option>
      <option value="cashapp">Cash App</option>
      <option value="venmo">Venmo</option>
      <option value="other">Other</option>
    </>
  )
}
