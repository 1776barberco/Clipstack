import type { BucketConfig } from '@/hooks/useBuckets'

export type ProfileSettingsValue = {
  email: string
  fullName: string
  boothRent: string
  dueDay: string
  taxRate: string
}

export type EditedAccount = {
  name?: string
  type?: string
  starting_balance?: string
}

export type EditedBucket = {
  name?: string
  group_name?: string
  percentage?: string
  color?: string
  target_amount?: string
  due_date?: string
  is_recurring?: string
  recurring_interval?: string
}

export type BucketField = keyof EditedBucket

export type BucketTotals = {
  percentageBuckets: BucketConfig[]
  fixedBuckets: BucketConfig[]
  totalPercentage: number
  totalFixed: number
}
