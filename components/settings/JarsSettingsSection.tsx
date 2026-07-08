'use client'

import type { RefObject } from 'react'
import { DollarSign, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import type { BucketConfig } from '@/hooks/useBuckets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BucketField, BucketTotals } from './types'

type JarsSettingsSectionProps = {
  buckets: BucketConfig[]
  totals: BucketTotals
  saving: boolean
  newBucketId: string | null
  newBucketNameRef: RefObject<HTMLInputElement | null>
  isFixedAmount: (bucketId: string) => boolean
  getBucketField: (id: string, field: BucketField, fallback: string) => string
  setBucketField: (id: string, field: BucketField, value: string) => void
  onToggleAllocationType: (bucketId: string) => void
  onAddBucket: () => void
  onDeleteBucket: (id: string, name: string) => void
  onSaveBuckets: () => void
}

export function JarsSettingsSection({
  buckets,
  totals,
  saving,
  newBucketId,
  newBucketNameRef,
  isFixedAmount,
  getBucketField,
  setBucketField,
  onToggleAllocationType,
  onAddBucket,
  onDeleteBucket,
  onSaveBuckets,
}: JarsSettingsSectionProps) {
  const percentageOutOfBalance = totals.percentageBuckets.length > 0 && Math.abs(totals.totalPercentage - 100) > 0.1

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Jars
            </CardTitle>
            <CardDescription>Configure how income is split. Use % for percentage-based or $ for fixed dollar amounts.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" className="min-h-10 w-full sm:w-auto" onClick={onAddBucket}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <datalist id="jar-group-suggestions">
          <option value="Personal" />
          <option value="Business" />
          <option value="Taxes" />
          <option value="Savings" />
          <option value="Bills" />
        </datalist>

        {buckets.map((bucket) => (
          <JarEditor
            key={bucket.id}
            bucket={bucket}
            fixed={isFixedAmount(bucket.id)}
            isNewBucket={bucket.id === newBucketId}
            newBucketNameRef={newBucketNameRef}
            getBucketField={getBucketField}
            setBucketField={setBucketField}
            onToggleAllocationType={onToggleAllocationType}
            onDeleteBucket={onDeleteBucket}
          />
        ))}

        {buckets.length > 0 && (
          <div className="space-y-3">
            {totals.percentageBuckets.length > 0 && (
              <div className={`rounded-xl border p-3 text-sm ${
                Math.abs(totals.totalPercentage - 100) < 0.1
                  ? 'border-green-500/20 bg-green-500/10 text-green-400'
                  : totals.totalPercentage > 100
                    ? 'border-red-500/20 bg-red-500/10 text-red-400'
                    : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
              }`}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium">Total: {totals.totalPercentage.toFixed(1)}%</span>
                  {Math.abs(totals.totalPercentage - 100) < 0.1 ? (
                    <span>Balanced</span>
                  ) : totals.totalPercentage > 100 ? (
                    <span>{(totals.totalPercentage - 100).toFixed(1)}% over</span>
                  ) : (
                    <span>{(100 - totals.totalPercentage).toFixed(1)}% remaining</span>
                  )}
                </div>
              </div>
            )}

            {totals.fixedBuckets.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Fixed amount jars: ${totals.totalFixed.toFixed(2)} per income
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" className="w-full sm:w-auto" onClick={onSaveBuckets} disabled={saving || percentageOutOfBalance}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Jars'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type JarEditorProps = {
  bucket: BucketConfig
  fixed: boolean
  isNewBucket: boolean
  newBucketNameRef: RefObject<HTMLInputElement | null>
  getBucketField: (id: string, field: BucketField, fallback: string) => string
  setBucketField: (id: string, field: BucketField, value: string) => void
  onToggleAllocationType: (bucketId: string) => void
  onDeleteBucket: (id: string, name: string) => void
}

function JarEditor({
  bucket,
  fixed,
  isNewBucket,
  newBucketNameRef,
  getBucketField,
  setBucketField,
  onToggleAllocationType,
  onDeleteBucket,
}: JarEditorProps) {
  const isRecurring = getBucketField(bucket.id, 'is_recurring', String(bucket.is_recurring ?? false)) === 'true'

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <input
          aria-label={`${bucket.name} color`}
          type="color"
          value={getBucketField(bucket.id, 'color', bucket.color)}
          onChange={(e) => setBucketField(bucket.id, 'color', e.target.value)}
          className="h-11 w-11 shrink-0 cursor-pointer rounded border-0 p-0"
        />
        <Input
          aria-label={`${bucket.name} name`}
          ref={isNewBucket ? newBucketNameRef : undefined}
          value={getBucketField(bucket.id, 'name', bucket.name)}
          onChange={(e) => setBucketField(bucket.id, 'name', e.target.value)}
          placeholder="Jar name"
          className="flex-1 font-medium"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={`Delete ${bucket.name}`}
          onClick={() => onDeleteBucket(bucket.id, bucket.name)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground" htmlFor={`bucket-group-${bucket.id}`}>Group</Label>
          <Input
            id={`bucket-group-${bucket.id}`}
            list="jar-group-suggestions"
            value={getBucketField(bucket.id, 'group_name', bucket.group_name ?? '')}
            onChange={(e) => setBucketField(bucket.id, 'group_name', e.target.value)}
            placeholder="Personal, Business, Taxes..."
          />
        </div>
        <span className="pb-2 text-xs text-muted-foreground">Optional</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleAllocationType(bucket.id)}
            className="min-h-10 shrink-0 rounded border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
            title={fixed ? 'Switch to percentage' : 'Switch to fixed dollar amount'}
            aria-label={fixed ? `Switch ${bucket.name} to percentage` : `Switch ${bucket.name} to fixed dollar amount`}
          >
            {fixed ? '$' : '%'}
          </button>
          {fixed ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                aria-label={`${bucket.name} fixed amount`}
                type="number"
                min={0}
                step="0.01"
                value={getBucketField(bucket.id, 'target_amount', (bucket.target_amount || 0).toString())}
                onChange={(e) => setBucketField(bucket.id, 'target_amount', e.target.value)}
                placeholder="0"
                className="w-28 text-center"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                aria-label={`${bucket.name} percentage`}
                type="number"
                min={0}
                max={100}
                value={getBucketField(bucket.id, 'percentage', bucket.percentage.toString())}
                onChange={(e) => setBucketField(bucket.id, 'percentage', e.target.value)}
                className="w-24 text-center"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap text-xs text-muted-foreground" htmlFor={`bucket-due-${bucket.id}`}>Due</Label>
          <Input
            id={`bucket-due-${bucket.id}`}
            type="date"
            value={getBucketField(bucket.id, 'due_date', bucket.due_date ?? '')}
            onChange={(e) => setBucketField(bucket.id, 'due_date', e.target.value)}
            className="w-40 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            id={`bucket-recurring-${bucket.id}`}
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => {
              setBucketField(bucket.id, 'is_recurring', String(e.target.checked))
              if (!e.target.checked) {
                setBucketField(bucket.id, 'recurring_interval', '')
              } else if (!getBucketField(bucket.id, 'recurring_interval', bucket.recurring_interval ?? '')) {
                setBucketField(bucket.id, 'recurring_interval', 'monthly')
              }
            }}
            className="h-4 w-4 rounded border-gray-300 accent-blue-500"
          />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            Recurring
          </span>
        </label>
        {isRecurring && (
          <select
            id={`bucket-recurring-interval-${bucket.id}`}
            aria-label={`${bucket.name} recurring interval`}
            value={getBucketField(bucket.id, 'recurring_interval', bucket.recurring_interval ?? 'monthly')}
            onChange={(e) => setBucketField(bucket.id, 'recurring_interval', e.target.value)}
            className="h-8 rounded border bg-background px-2 text-xs"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        )}
      </div>
    </div>
  )
}
