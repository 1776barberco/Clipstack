'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useUpcomingBills, billCategoryMeta } from '@/hooks/useUpcomingBills'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  List,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Trash2,
  DollarSign,
  Repeat,
  Plus,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  differenceInDays,
} from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export function UpcomingBillsCard() {
  const { user } = useAuthContext()
  const {
    pendingBills,
    loading,
    addBill,
    markAsPaid,
    skipBill,
    deleteBill,
    getDueSoon,
    getOverdue,
    getBillsForMonth,
    getMonthTotal,
  } = useUpcomingBills(user?.id)

  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDueDate, setFormDueDate] = useState('')
  const [formCategory, setFormCategory] = useState<string>('other')
  const [formRecurring, setFormRecurring] = useState(false)
  const [formInterval, setFormInterval] = useState<string>('monthly')
  const [formNotes, setFormNotes] = useState('')

  const overdue = getOverdue()
  const dueSoon = getDueSoon(3)
  const monthTotal = getMonthTotal(currentMonth)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const handleAddBill = async () => {
    if (!formName || !formAmount || !formDueDate) {
      toast.error('Name, amount, and due date are required')
      return
    }

    await addBill({
      user_id: user?.id || '',
      name: formName,
      amount: parseFloat(formAmount),
      due_date: formDueDate,
      category: formCategory as 'zip' | 'klarna' | 'credit_card' | 'personal' | 'other',
      is_recurring: formRecurring,
      recurring_interval: formRecurring ? (formInterval as 'weekly' | 'biweekly' | 'monthly' | 'quarterly') : null,
      notes: formNotes || null,
    })

    // Reset form
    setFormName('')
    setFormAmount('')
    setFormDueDate('')
    setFormCategory('other')
    setFormRecurring(false)
    setFormInterval('monthly')
    setFormNotes('')
    setAddDialogOpen(false)
    toast.success('Bill added!')
  }

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })
  const allBillsForMonth = getBillsForMonth(currentMonth)

  const getBillsForDay = (day: Date) => {
    return allBillsForMonth.filter(b => isSameDay(new Date(b.due_date), day))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bills
            {overdue.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {overdue.length} overdue
              </Badge>
            )}
            {dueSoon.length > 0 && overdue.length === 0 && (
              <Badge className="ml-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                {dueSoon.length} due soon
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'calendar' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView('calendar')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Upcoming Bill</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Bill Name</Label>
                    <Input
                      placeholder="e.g. Zip - Hair Tools Order"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formAmount}
                        onChange={e => setFormAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={formDueDate}
                        onChange={e => setFormDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zip">Zip</SelectItem>
                        <SelectItem value="klarna">Klarna</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formRecurring}
                        onChange={e => setFormRecurring(e.target.checked)}
                        className="rounded"
                      />
                      Recurring
                    </label>
                    {formRecurring && (
                      <Select value={formInterval} onValueChange={setFormInterval}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Biweekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      placeholder="e.g. 2nd of 4 payments"
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddBill} className="w-full">
                    Add Bill
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pendingBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-10 w-10 text-green-500/50 mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming bills</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap &quot;Add Bill&quot; to track your next payment
            </p>
          </div>
        ) : view === 'list' ? (
          /* ===== LIST VIEW ===== */
          <div className="space-y-2">
            {/* Overdue */}
            {overdue.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-destructive uppercase tracking-wide">
                  Overdue
                </p>
                {overdue.map(bill => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    onPaid={() => markAsPaid(bill.id)}
                    onSkip={() => skipBill(bill.id)}
                    onDelete={() => deleteBill(bill.id)}
                    isOverdue
                  />
                ))}
              </div>
            )}

            {/* Due Soon */}
            {dueSoon.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                  Due Soon
                </p>
                {dueSoon.filter(b => !overdue.includes(b)).map(bill => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    onPaid={() => markAsPaid(bill.id)}
                    onSkip={() => skipBill(bill.id)}
                    onDelete={() => deleteBill(bill.id)}
                    isDueSoon
                  />
                ))}
              </div>
            )}

            {/* Rest */}
            <div className="space-y-2">
              {pendingBills
                .filter(b => !overdue.includes(b) && !dueSoon.includes(b))
                .map(bill => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    onPaid={() => markAsPaid(bill.id)}
                    onSkip={() => skipBill(bill.id)}
                    onDelete={() => deleteBill(bill.id)}
                  />
                ))}
            </div>
          </div>
        ) : (
          /* ===== CALENDAR VIEW ===== */
          <div>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="font-medium">{format(currentMonth, 'MMMM yyyy')}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(monthTotal)} due this month
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <p key={d} className="text-center text-xs text-muted-foreground py-1">
                  {d}
                </p>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calDays.map(day => {
                const dayBills = getBillsForDay(day)
                const inMonth = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-[60px] rounded-lg p-1 text-xs border
                      ${inMonth ? 'bg-card border-border' : 'bg-muted/30 border-transparent opacity-40'}
                      ${isToday ? 'ring-1 ring-primary' : ''}
                    `}
                  >
                    <p className={`text-right mb-0.5 ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </p>
                    <div className="space-y-0.5">
                      {dayBills.map(bill => (
                        <div
                          key={bill.id}
                          className={`
                            truncate rounded px-1 py-0.5 text-[10px] font-medium
                            ${billCategoryMeta.CATEGORY_COLORS[bill.category]}
                            ${bill.status === 'paid' ? 'opacity-50 line-through' : ''}
                          `}
                          title={`${bill.name} - ${formatCurrency(bill.amount)}`}
                        >
                          {formatCurrency(bill.amount)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Category legend */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
              {(Object.keys(billCategoryMeta.CATEGORY_LABELS) as Array<keyof typeof billCategoryMeta.CATEGORY_LABELS>).map(cat => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${billCategoryMeta.CATEGORY_COLORS[cat].split(' ')[0]}`} />
                  <span className="text-[10px] text-muted-foreground">
                    {billCategoryMeta.CATEGORY_LABELS[cat]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Individual bill row component
function BillRow({
  bill,
  onPaid,
  onSkip,
  onDelete,
  isOverdue,
  isDueSoon,
}: {
  bill: {
    id: string
    name: string
    amount: number
    due_date: string
    category: 'zip' | 'klarna' | 'credit_card' | 'personal' | 'other'
    is_recurring: boolean
    recurring_interval: string | null
    notes: string | null
  }
  onPaid: () => void
  onSkip: () => void
  onDelete: () => void
  isOverdue?: boolean
  isDueSoon?: boolean
}) {
  const daysUntil = differenceInDays(new Date(bill.due_date), new Date())

  return (
    <div
      className={`
        flex items-center gap-3 rounded-lg border p-3
        ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}
        ${isDueSoon ? 'border-amber-500/50 bg-amber-500/5' : ''}
      `}
    >
      {/* Category + Icon */}
      <div className={`
        flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
        ${billCategoryMeta.CATEGORY_COLORS[bill.category]}
      `}>
        <CreditCard className="h-4 w-4" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-sm truncate">{bill.name}</p>
          {bill.is_recurring && (
            <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${billCategoryMeta.CATEGORY_COLORS[bill.category]}`}
          >
            {billCategoryMeta.CATEGORY_LABELS[bill.category]}
          </Badge>
          <span className={`text-xs ${
            isOverdue ? 'text-destructive' : isDueSoon ? 'text-amber-400' : 'text-muted-foreground'
          }`}>
            {isOverdue
              ? `${Math.abs(daysUntil)}d overdue`
              : daysUntil === 0
                ? 'Due today'
                : `${daysUntil}d`
            }
          </span>
        </div>
        {bill.notes && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{bill.notes}</p>
        )}
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="font-semibold text-sm">{formatCurrency(bill.amount)}</p>
        <p className="text-[10px] text-muted-foreground">
          {format(new Date(bill.due_date), 'MMM d')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-green-500 hover:text-green-400 hover:bg-green-500/10"
          onClick={onPaid}
          title="Mark as paid"
        >
          <DollarSign className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
