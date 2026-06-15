export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          booth_rent_amount: number | null
          booth_rent_due_day: number | null
          tax_rate: number
          starting_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          booth_rent_amount?: number | null
          booth_rent_due_day?: number | null
          tax_rate?: number
          starting_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          booth_rent_amount?: number | null
          booth_rent_due_day?: number | null
          tax_rate?: number
          starting_balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bucket_configs: {
        Row: {
          id: string
          user_id: string
          name: string
          group_name: string | null
          percentage: number
          target_amount: number | null
          is_tax_bucket: boolean
          priority: number
          color: string
          is_recurring: boolean
          recurring_interval: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          group_name?: string | null
          percentage: number
          target_amount?: number | null
          is_tax_bucket?: boolean
          priority?: number
          color?: string
          is_recurring?: boolean
          recurring_interval?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          group_name?: string | null
          percentage?: number
          target_amount?: number | null
          is_tax_bucket?: boolean
          priority?: number
          color?: string
          is_recurring?: boolean
          recurring_interval?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          id: string
          user_id: string
          amount: number
          source: string | null
          notes: string | null
          entry_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          source?: string | null
          notes?: string | null
          entry_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          source?: string | null
          notes?: string | null
          entry_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          bucket_id: string | null
          amount: number
          description: string | null
          category: string | null
          entry_date: string
          account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bucket_id?: string | null
          amount: number
          description?: string | null
          category?: string | null
          entry_date?: string
          account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bucket_id?: string | null
          amount?: number
          description?: string | null
          category?: string | null
          entry_date?: string
          account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bucket_transactions: {
        Row: {
          id: string
          user_id: string
          bucket_id: string
          income_entry_id: string | null
          amount: number
          type: 'deposit' | 'withdrawal' | 'transfer'
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bucket_id: string
          income_entry_id?: string | null
          amount: number
          type: 'deposit' | 'withdrawal' | 'transfer'
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bucket_id?: string
          income_entry_id?: string | null
          amount?: number
          type?: 'deposit' | 'withdrawal' | 'transfer'
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      weekly_snapshots: {
        Row: {
          id: string
          user_id: string
          week_start: string
          week_end: string
          total_income: number
          bucket_balances: Json
          stability_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          week_end: string
          total_income: number
          bucket_balances: Json
          stability_score: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          week_end?: string
          total_income?: number
          bucket_balances?: Json
          stability_score?: number
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      coaching_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: 'weekly_recap' | 'jar_recommendation' | 'seasonal_forecast' | 'spending_alert' | 'money_tip'
          title: string
          body: string
          data: Json
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: 'weekly_recap' | 'jar_recommendation' | 'seasonal_forecast' | 'spending_alert' | 'money_tip'
          title: string
          body: string
          data?: Json
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: 'weekly_recap' | 'jar_recommendation' | 'seasonal_forecast' | 'spending_alert' | 'money_tip'
          title?: string
          body?: string
          data?: Json
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
          current_period_start: string | null
          current_period_end: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plaid_items: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string
          access_token: string
          institution_id: string | null
          institution_name: string | null
          products: string[]
          available_products: string[] | null
          billed_products: string[] | null
          transactions_cursor: string | null
          status: 'active' | 'error' | 'revoked' | 'removed'
          error_code: string | null
          error_message: string | null
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_item_id: string
          access_token: string
          institution_id?: string | null
          institution_name?: string | null
          products?: string[]
          available_products?: string[] | null
          billed_products?: string[] | null
          transactions_cursor?: string | null
          status?: 'active' | 'error' | 'revoked' | 'removed'
          error_code?: string | null
          error_message?: string | null
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plaid_item_id?: string
          access_token?: string
          institution_id?: string | null
          institution_name?: string | null
          products?: string[]
          available_products?: string[] | null
          billed_products?: string[] | null
          transactions_cursor?: string | null
          status?: 'active' | 'error' | 'revoked' | 'removed'
          error_code?: string | null
          error_message?: string | null
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plaid_accounts: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string
          plaid_account_id: string
          bank_account_id: string | null
          name: string
          official_name: string | null
          mask: string | null
          type: string | null
          subtype: string | null
          verification_status: string | null
          current_balance: number | null
          available_balance: number | null
          iso_currency_code: string | null
          unofficial_currency_code: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_item_id: string
          plaid_account_id: string
          bank_account_id?: string | null
          name: string
          official_name?: string | null
          mask?: string | null
          type?: string | null
          subtype?: string | null
          verification_status?: string | null
          current_balance?: number | null
          available_balance?: number | null
          iso_currency_code?: string | null
          unofficial_currency_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plaid_item_id?: string
          plaid_account_id?: string
          bank_account_id?: string | null
          name?: string
          official_name?: string | null
          mask?: string | null
          type?: string | null
          subtype?: string | null
          verification_status?: string | null
          current_balance?: number | null
          available_balance?: number | null
          iso_currency_code?: string | null
          unofficial_currency_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plaid_transactions: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string
          plaid_account_id: string
          plaid_transaction_id: string
          name: string
          merchant_name: string | null
          amount: number
          iso_currency_code: string | null
          unofficial_currency_code: string | null
          date: string
          authorized_date: string | null
          pending: boolean
          pending_transaction_id: string | null
          payment_channel: string | null
          category: string[] | null
          category_id: string | null
          primary_category: string | null
          detailed_category: string | null
          transaction_type: 'income' | 'expense' | 'transfer'
          personal_finance_category: Json
          location: Json
          raw: Json
          ignored: boolean
          matched_bucket_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_item_id: string
          plaid_account_id: string
          plaid_transaction_id: string
          name: string
          merchant_name?: string | null
          amount: number
          iso_currency_code?: string | null
          unofficial_currency_code?: string | null
          date: string
          authorized_date?: string | null
          pending?: boolean
          pending_transaction_id?: string | null
          payment_channel?: string | null
          category?: string[] | null
          category_id?: string | null
          primary_category?: string | null
          detailed_category?: string | null
          transaction_type?: 'income' | 'expense' | 'transfer'
          personal_finance_category?: Json
          location?: Json
          raw?: Json
          ignored?: boolean
          matched_bucket_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plaid_item_id?: string
          plaid_account_id?: string
          plaid_transaction_id?: string
          name?: string
          merchant_name?: string | null
          amount?: number
          iso_currency_code?: string | null
          unofficial_currency_code?: string | null
          date?: string
          authorized_date?: string | null
          pending?: boolean
          pending_transaction_id?: string | null
          payment_channel?: string | null
          category?: string[] | null
          category_id?: string | null
          primary_category?: string | null
          detailed_category?: string | null
          transaction_type?: 'income' | 'expense' | 'transfer'
          personal_finance_category?: Json
          location?: Json
          raw?: Json
          ignored?: boolean
          matched_bucket_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      bucket_balances: {
        Row: {
          bucket_id: string
          user_id: string
          bucket_name: string
          group_name: string | null
          color: string
          percentage: number
          total_deposits: number
          total_withdrawals: number
          total_expenses: number
          current_balance: number
        }
        Relationships: []
      }
    }
    Functions: {
      allocate_income_to_buckets: {
        Args: {
          p_user_id: string
          p_income_entry_id: string
          p_amount: number
        }
        Returns: void
      }
      assign_plaid_income_to_buckets: {
        Args: {
          p_user_id: string
          p_transaction_id: string
          p_allocations: Record<string, number>
          p_note?: string | null
        }
        Returns: Json
      }
      assign_plaid_expense_to_bucket: {
        Args: {
          p_user_id: string
          p_transaction_id: string
          p_bucket_id: string
          p_amount?: number | null
          p_note?: string | null
        }
        Returns: Json
      }
      get_stability_score: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      advance_jar_due_date: {
        Args: {
          p_bucket_id: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      transaction_type: 'deposit' | 'withdrawal' | 'transfer'
    }
  }
}
