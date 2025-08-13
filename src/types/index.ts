export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  avatar?: string;
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