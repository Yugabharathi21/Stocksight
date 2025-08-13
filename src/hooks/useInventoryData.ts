import { useState, useEffect } from 'react';
import { Product, ForecastData } from '../types';

// Mock data - replace with actual API calls
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Rice 5kg',
    sku: 'ORG-RICE-5K',
    currentStock: 45,
    predictedDemand: 120,
    confidence: 0.89,
    recommendation: 'increase',
    category: 'Grains',
    lastSaleDate: '2024-12-22',
    price: 350,
  },
  {
    id: '2',
    name: 'Wheat Flour 10kg',
    sku: 'WHT-FLR-10K',
    currentStock: 78,
    predictedDemand: 65,
    confidence: 0.76,
    recommendation: 'maintain',
    category: 'Grains',
    lastSaleDate: '2024-12-23',
    price: 420,
  },
  {
    id: '3',
    name: 'Coconut Oil 1L',
    sku: 'COC-OIL-1L',
    currentStock: 156,
    predictedDemand: 89,
    confidence: 0.92,
    recommendation: 'reduce',
    category: 'Oils',
    lastSaleDate: '2024-12-21',
    price: 180,
  },
  {
    id: '4',
    name: 'Basmati Rice 1kg',
    sku: 'BAS-RICE-1K',
    currentStock: 23,
    predictedDemand: 145,
    confidence: 0.87,
    recommendation: 'increase',
    category: 'Grains',
    lastSaleDate: '2024-12-23',
    price: 120,
  },
  {
    id: '5',
    name: 'Turmeric Powder 500g',
    sku: 'TUR-PWD-500G',
    currentStock: 67,
    predictedDemand: 78,
    confidence: 0.81,
    recommendation: 'maintain',
    category: 'Spices',
    lastSaleDate: '2024-12-22',
    price: 95,
  },
];

const mockForecastData: ForecastData[] = [
  { date: '2024-12-16', actual: 45, predicted: 42, lower_bound: 35, upper_bound: 49 },
  { date: '2024-12-17', actual: 52, predicted: 48, lower_bound: 41, upper_bound: 55 },
  { date: '2024-12-18', actual: 38, predicted: 41, lower_bound: 34, upper_bound: 48 },
  { date: '2024-12-19', actual: 61, predicted: 58, lower_bound: 51, upper_bound: 65 },
  { date: '2024-12-20', actual: 47, predicted: 45, lower_bound: 38, upper_bound: 52 },
  { date: '2024-12-21', actual: 55, predicted: 52, lower_bound: 45, upper_bound: 59 },
  { date: '2024-12-22', actual: 43, predicted: 47, lower_bound: 40, upper_bound: 54 },
  { date: '2024-12-23', predicted: 58, lower_bound: 51, upper_bound: 65 },
  { date: '2024-12-24', predicted: 62, lower_bound: 55, upper_bound: 69 },
  { date: '2024-12-25', predicted: 49, lower_bound: 42, upper_bound: 56 },
  { date: '2024-12-26', predicted: 71, lower_bound: 64, upper_bound: 78 },
  { date: '2024-12-27', predicted: 65, lower_bound: 58, upper_bound: 72 },
  { date: '2024-12-28', predicted: 54, lower_bound: 47, upper_bound: 61 },
  { date: '2024-12-29', predicted: 68, lower_bound: 61, upper_bound: 75 },
];

export const useInventoryData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setProducts(mockProducts);
      setForecastData(mockForecastData);
      setIsLoading(false);
    };

    loadData();
  }, []);

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

  return {
    products,
    forecastData,
    isLoading,
    getLowStockProducts,
    getOverstockProducts,
    getRecommendationCounts,
  };
};