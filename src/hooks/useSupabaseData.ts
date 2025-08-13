import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, ForecastData } from '../types';

export const useSupabaseData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load products with current stock and forecasts
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;

      // Load latest forecasts for each product
      const { data: forecastsData, error: forecastsError } = await supabase
        .from('demand_forecasts')
        .select('*')
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date');

      if (forecastsError) throw forecastsError;

      // Load alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          products (name, sku)
        `)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Transform products data
      const transformedProducts: Product[] = productsData?.map(product => {
        const productForecasts = forecastsData?.filter(f => f.product_id === product.id) || [];
        const latestForecast = productForecasts[0];
        
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.current_stock,
          predictedDemand: latestForecast?.predicted_demand || 0,
          confidence: latestForecast?.confidence_score || 0,
          recommendation: getRecommendation(product.current_stock, latestForecast?.predicted_demand || 0),
          category: product.category,
          lastSaleDate: new Date().toISOString().split('T')[0], // Mock data
          price: product.unit_price,
        };
      }) || [];

      // Transform forecast data for charts
      const transformedForecastData: ForecastData[] = forecastsData?.map(forecast => ({
        date: forecast.forecast_date,
        predicted: forecast.predicted_demand,
        lower_bound: forecast.lower_bound,
        upper_bound: forecast.upper_bound,
      })) || [];

      setProducts(transformedProducts);
      setForecastData(transformedForecastData);
      setAlerts(alertsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendation = (currentStock: number, predictedDemand: number): 'increase' | 'reduce' | 'maintain' => {
    if (currentStock < predictedDemand * 0.5) return 'increase';
    if (currentStock > predictedDemand * 2) return 'reduce';
    return 'maintain';
  };

  const getLowStockProducts = () => {
    return products.filter(product => 
      product.currentStock < product.predictedDemand * 0.3
    );
  };

  const getOverstockProducts = () => {
    return products.filter(product => 
      product.currentStock > product.predictedDemand * 2
    );
  };

  const getRecommendationCounts = () => {
    return products.reduce((acc, product) => {
      acc[product.recommendation] = (acc[product.recommendation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const addProduct = async (productData: any) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;
      await loadData(); // Refresh data
      return data[0];
    } catch (err) {
      console.error('Error adding product:', err);
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      await loadData(); // Refresh data
      return data[0];
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error marking alert as read:', err);
      throw err;
    }
  };

  return {
    products,
    forecastData,
    alerts,
    isLoading,
    error,
    getLowStockProducts,
    getOverstockProducts,
    getRecommendationCounts,
    addProduct,
    updateProduct,
    deleteProduct,
    markAlertAsRead,
    refreshData: loadData,
  };
};