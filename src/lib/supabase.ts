import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: string;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: string;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          sku: string;
          category: string;
          current_stock: number;
          min_stock_level: number;
          max_stock_level: number;
          unit_price: number;
          supplier_info: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sku: string;
          category: string;
          current_stock?: number;
          min_stock_level?: number;
          max_stock_level?: number;
          unit_price: number;
          supplier_info?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sku?: string;
          category?: string;
          current_stock?: number;
          min_stock_level?: number;
          max_stock_level?: number;
          unit_price?: number;
          supplier_info?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales_data: {
        Row: {
          id: string;
          product_id: string;
          quantity_sold: number;
          sale_price: number;
          sale_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity_sold: number;
          sale_price: number;
          sale_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity_sold?: number;
          sale_price?: number;
          sale_date?: string;
          created_at?: string;
        };
      };
      demand_forecasts: {
        Row: {
          id: string;
          product_id: string;
          forecast_date: string;
          predicted_demand: number;
          confidence_score: number;
          lower_bound: number;
          upper_bound: number;
          model_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          forecast_date: string;
          predicted_demand: number;
          confidence_score: number;
          lower_bound: number;
          upper_bound: number;
          model_version?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          forecast_date?: string;
          predicted_demand?: number;
          confidence_score?: number;
          lower_bound?: number;
          upper_bound?: number;
          model_version?: string;
          created_at?: string;
        };
      };
      inventory_alerts: {
        Row: {
          id: string;
          product_id: string;
          alert_type: 'low_stock' | 'overstock' | 'high_demand';
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          alert_type: 'low_stock' | 'overstock' | 'high_demand';
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          alert_type?: 'low_stock' | 'overstock' | 'high_demand';
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
  };
}