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
          percentage: number
          target_amount: number | null
          is_tax_bucket: boolean
          priority: number
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          percentage: number
          target_amount?: number | null
          is_tax_bucket?: boolean
          priority?: number
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          percentage?: number
          target_amount?: number | null
          is_tax_bucket?: boolean
          priority?: number
          color?: string
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
          bucket_id: string
          amount: number
          description: string | null
          category: string | null
          entry_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bucket_id: string
          amount: number
          description?: string | null
          category?: string | null
          entry_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bucket_id?: string
          amount?: number
          description?: string | null
          category?: string | null
          entry_date?: string
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
    }
    Views: {
      bucket_balances: {
        Row: {
          bucket_id: string
          user_id: string
          bucket_name: string
          total_deposits: number
          total_withdrawals: number
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
      get_stability_score: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      transaction_type: 'deposit' | 'withdrawal' | 'transfer'
    }
  }
}
