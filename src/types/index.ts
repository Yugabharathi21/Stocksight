export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  predictedDemand: number;
  confidence: number;
  recommendation: 'increase' | 'reduce' | 'maintain';
  category: string;
  lastSaleDate: string;
  price: number;
}

export interface SalesData {
  date: string;
  sales: number;
  product: string;
}

export interface ForecastData {
  date: string;
  actual?: number;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
}

export interface AlertConfig {
  id: string;
  type: 'low_stock' | 'high_demand' | 'overstock';
  threshold: number;
  enabled: boolean;
  notify_email: boolean;
  notify_sms: boolean;
}